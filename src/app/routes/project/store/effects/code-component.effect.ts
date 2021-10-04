/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as cd from 'cd-interfaces';
import { switchMap, withLatestFrom, filter, map, tap } from 'rxjs/operators';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { RecordActionService } from '../../services/record-action/record-action.service';
import * as actions from '../actions/code-component.action';
import { PropertiesService } from '../../services/properties/properties.service';
import {
  getModels,
  getModelsAndChildren,
  registerCodeComponent,
  unRegisterCodeComponent,
} from 'cd-common/models';
import { ElementPropertiesDelete, ElementPropertiesUpdate } from '../actions';
import {
  mergeInputUpdatesIntoCodeComponentInstance,
  getInstancesOfCodeComponent,
  createCodeCmpChangePayload,
} from 'cd-common/utils';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { ProjectChangeCoordinator } from 'src/app/database/changes/project-change.coordinator';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { forkJoin, from, Observable, of } from 'rxjs';
import { UploadService } from '../../services/upload/upload.service';

@Injectable()
export class CodeComponentEffects {
  // Track of what code component JavaScript bundles have been downloaded and sent to the renderer
  private _loadedBundles = new Set<string>();

  constructor(
    private actions$: Actions,
    private _propsService: PropertiesService,
    private _recordSerivce: RecordActionService,
    private _projectContentService: ProjectContentService,
    private _projectChangeCoordinator: ProjectChangeCoordinator,
    private _rendererService: RendererService,
    private _uploadService: UploadService
  ) {}

  /**
   * Construct change request for creating a new code component definition
   */
  create$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentCreate>(actions.CODE_COMPONENT_CREATE),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        tap(([action]) => {
          const sets = action.codeComponents;
          const changeRequestPayload = createCodeCmpChangePayload(sets);
          return this._projectChangeCoordinator.dispatchChangeRequest([changeRequestPayload]);
        })
      ),
    { dispatch: false }
  );

  /**
   * Construct change request for updating a code component
   */
  update$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentUpdate>(actions.CODE_COMPONENT_UPDATE),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        tap(([action]) => {
          const { id, update } = action;
          const updates: cd.IUpdateChange<cd.ICodeComponentDocument>[] = [{ id, update }];
          const changeRequestPayload = createCodeCmpChangePayload(undefined, updates);
          return this._projectChangeCoordinator.dispatchChangeRequest([changeRequestPayload]);
        })
      ),
    { dispatch: false }
  );

  /**
   * Construct change request for updating a code component
   */
  delete$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentDelete>(actions.CODE_COMPONENT_DELETE),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        tap(([action]) => {
          const deletes = [action.codeComponent.id];
          const changeRequestPayload = createCodeCmpChangePayload(undefined, undefined, deletes);
          return this._projectChangeCoordinator.dispatchChangeRequest([changeRequestPayload]);
        })
      ),
    { dispatch: false }
  );

  /**
   * When a code component is updated in the project, updates inputs on instances of it
   * 1. Add default values to new inputs
   * 2. Remove inputs that were deleted (also occurs if binding was renamed)
   */
  updateAllInstances$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.CodeComponentUpdate>(actions.CODE_COMPONENT_UPDATE),
      withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
      filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
      map(([action]) => action),
      withLatestFrom(this._projectContentService.project$),
      filter(([, proj]) => proj !== undefined),
      withLatestFrom(this._projectContentService.elementProperties$),
      switchMap(([[action], elementProperties]) => {
        const { id, update } = action;
        const { properties, ...otherUpdates } = update;
        const instances = getInstancesOfCodeComponent(id, elementProperties);

        // TODO: Also need to merge in other properties: allowChildren, fitContent, etc
        const updates = instances.reduce<cd.IPropertiesUpdatePayload[]>((acc, curr) => {
          const { id: elementId } = curr;
          const propertyUpdates = { ...otherUpdates } as Partial<cd.ICodeComponentInstance>;
          if (properties) {
            const inputs = mergeInputUpdatesIntoCodeComponentInstance(properties, curr.inputs);
            propertyUpdates.inputs = inputs;
          }
          const currUpdate: cd.IPropertiesUpdatePayload = {
            elementId,
            properties: propertyUpdates,
          };
          acc.push(currUpdate);
          return acc;
        }, []);

        if (updates.length > 0) return [new ElementPropertiesUpdate(updates, false)];
        return [];
      })
    )
  );

  /**
   * When a code component is deleted from the project, remove all instances of it
   * from the elementProperties map
   */
  deleteAllInstances$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.CodeComponentDelete>(actions.CODE_COMPONENT_DELETE),
      withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
      filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
      map(([action]) => action),
      withLatestFrom(this._projectContentService.project$),
      filter(([, proj]) => proj !== undefined),
      withLatestFrom(this._projectContentService.elementProperties$),
      map(([[action], elementProperties]) => {
        const { codeComponent } = action;
        const elementModels = getModels(elementProperties);
        const instances = elementModels.filter((m) => m.elementType === codeComponent.id);
        const instanceIds = instances.map((i) => i.id);
        const instancesAndChildren = getModelsAndChildren(instanceIds, elementProperties);
        return new ElementPropertiesDelete(instancesAndChildren, false);
      })
    )
  );

  openCodeComponentEditor$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentOpenEditor>(actions.CODE_COMPONENT_OPEN_EDITOR),
        tap((action) => {
          const { propertyModels } = action.payload;
          const model = propertyModels && (propertyModels[0] as cd.ICodeComponentInstance);
          if (model) this._propsService.editCodeComponentInstance(model);
        })
      ),
    { dispatch: false }
  );

  /**
   * Anytime code components are updated, update the component registry also
   */
  registerCodeComponents$ = createEffect(
    () =>
      this._projectContentService.codeCmpContent$.pipe(
        tap((codeCmpContent) => {
          const {
            idsCreatedInLastChange,
            idsUpdatedInLastChange,
            idsDeletedInLastChange,
            records,
          } = codeCmpContent;
          const registerIds = [...idsCreatedInLastChange, ...idsUpdatedInLastChange];
          const unRegisterIds = [...idsDeletedInLastChange];

          for (const id of registerIds) {
            const cmp = records[id];
            if (cmp) registerCodeComponent(cmp);
          }

          for (const id of unRegisterIds) {
            unRegisterCodeComponent(id);
          }
        })
      ),
    { dispatch: false }
  );

  /**
   * Add code components to renderer anytime one is created
   */
  addCodeCmpsInRenderer$ = createEffect(
    () =>
      this._projectContentService.codeCmpContent$.pipe(
        filter((content) => !!content.idsCreatedInLastChange.size),
        switchMap((content) => {
          const idsCreated = Array.from(content.idsCreatedInLastChange);
          const codeCmps = idsCreated.map((id) => content.records[id]);
          const storagePaths = codeCmps.map((c) => c.jsBundleStoragePath);

          // Record the bundles that we are about to download and send to renderer
          this._loadedBundles = new Set([...this._loadedBundles, ...storagePaths]);

          const jsBlob$ = this._getCodeComponentJsBlobs(codeCmps);
          return forkJoin([of(codeCmps), jsBlob$]);
        }),
        tap(([codeComponents, jsBlobs]) =>
          this._rendererService.addCodeComponents(codeComponents, jsBlobs)
        )
      ),
    { dispatch: false }
  );

  /**
   * Send any code component updates to renderer.
   * If the update includes new js bundle, download it and send it also
   */
  updateCodeCmpsInRenderer$ = createEffect(
    () =>
      this._projectContentService.codeCmpContent$.pipe(
        filter((content) => !!content.idsUpdatedInLastChange.size),
        switchMap((content) => {
          // Record the bundles that we are about to download and send to renderer
          const idsUpdates = Array.from(content.idsUpdatedInLastChange);
          const updatedCodeCmps = idsUpdates.map((id) => content.records[id]);

          // Add updated bundles (as needed) together with updated code component documents
          const updates = updatedCodeCmps.map((codeCmp) => {
            const { jsBundleStoragePath } = codeCmp;
            const bundleLoaded = this._loadedBundles.has(jsBundleStoragePath);
            const updatedJS$ = bundleLoaded
              ? of(undefined)
              : this._getCodeComponentJsBlobs([codeCmp]);

            return forkJoin([of(codeCmp), updatedJS$]);
          });

          return forkJoin(updates);
        }),
        tap((updates) => {
          for (const [codeCmp, updatedJsBlobs] of updates) {
            const jsBlob = updatedJsBlobs ? updatedJsBlobs[codeCmp.id] : undefined;
            this._rendererService.updateCodeComponent(codeCmp, jsBlob);
          }
        })
      ),
    { dispatch: false }
  );

  /**
   * Delete code components from renderer anytime they are deleted
   */
  deleteCodeCmpsInRenderer = createEffect(
    () =>
      this._projectContentService.codeCmpContent$.pipe(
        filter((content) => !!content.idsDeletedInLastChange.size),
        tap((content) => {
          const deletedIds = Array.from(content.idsDeletedInLastChange);
          return this._rendererService.deleteCodeComponents(deletedIds);
        })
      ),
    { dispatch: false }
  );

  private _getCodeComponentJsBlobs = (
    codeComponents: cd.ICodeComponentDocument[]
  ): Observable<Record<string, Blob>> => {
    const codeComponentIds = codeComponents.map((c) => c.id);
    const bundleStoragePaths = codeComponents.map((c) => c.jsBundleStoragePath);
    const downloadedBundles$ = from(this._uploadService.downloadMultipleFiles(bundleStoragePaths));
    const downloadMap$ = downloadedBundles$.pipe(
      map((blobs) => {
        return blobs.reduce<Record<string, Blob>>((acc, curr, idx) => {
          const id = codeComponentIds[idx];
          acc[id] = curr;
          return acc;
        }, {});
      })
    );
    return downloadMap$;
  };
}
