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

/* eslint-disable max-lines */
import { RouterNavigatedAction, ROUTER_NAVIGATION } from '@ngrx/router-store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { ofUndoRedo, ofTypeIncludingBundled } from '../../utils/history-ngrx.utils';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { tap, withLatestFrom, map, filter, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { IProjectState } from '../reducers/index';
import { select, Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { getSymbolMode } from '../selectors/panels.selector';
import {
  getElementProperties,
  getElementPropertiesLoaded,
  selectCodeComponents,
} from '../selectors';
import { getModelsForUpdates } from 'cd-common/models';
import {
  buildParentUpdatesFromAddedChildren,
  updatesRequireRecompile,
} from '../../utils/renderer.utils';
import * as config from 'src/app/configs/routes.config';
import * as actions from '../actions';
import * as cd from 'cd-interfaces';
import { UploadService } from '../../services/upload/upload.service';
import { forkJoin, of, Observable, from } from 'rxjs';
import { buildPropertyUpdatePayload } from 'cd-common/utils';

/**
 * This is a set of effects to keep the renderer in sync with state changes in the app
 */
@Injectable()
export class RendererEffects {
  constructor(
    private actions$: Actions,
    private _rendererService: RendererService,
    private _projectStore: Store<IProjectState>,
    private _uploadService: UploadService
  ) {}

  /**
   * Sync design system with renderer
   */

  setDesignSystem$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DesignSystemRemoteAdded | actions.DesignSystemDocumentCreate>(
          actions.DESIGN_SYSTEM_REMOTE_ADDED,
          actions.DESIGN_SYSTEM_DOCUMENT_CREATE
        ),
        tap(({ payload }) => this._rendererService.setDesignSystem(payload))
      ),
    { dispatch: false }
  );

  updateDesignSystem$ = createEffect(
    () =>
      this.actions$.pipe(
        ofTypeIncludingBundled<actions.DesignSystemUpdate>(actions.DESIGN_SYSTEM_UPDATE),
        tap(({ update }) => this._rendererService.updateDesignSystem(update))
      ),
    { dispatch: false }
  );

  updateDesignSystemRemote$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DesignSystemRemoteModified>(actions.DESIGN_SYSTEM_REMOTE_MODIFIED),
        tap(({ payload }) => this._rendererService.updateDesignSystem(payload))
      ),
    { dispatch: false }
  );

  undoRedoUpdateDesignSystem$ = createEffect(
    () =>
      this.actions$.pipe(
        ofUndoRedo<actions.DesignSystemUpdate>(this._projectStore, actions.DESIGN_SYSTEM_UPDATE),
        filter(([, destState, [undoneUpdate]]) => {
          if (!destState || !undoneUpdate) return false;
          if (!destState.designSystem.designSystem) return false;
          return true;
        }),
        map(([, destState]) => {
          const designSystemDoc = destState.designSystem.designSystem as cd.IDesignSystem;
          this._rendererService.updateDesignSystem(designSystemDoc);
        })
      ),
    { dispatch: false }
  );

  /**
   * Anytime a board gets added, updated, or deleted, send to renderer
   */

  createElementProperties$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesCreate>(actions.ELEMENT_PROPS_CREATE),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        withLatestFrom(this._projectStore.pipe(select(getSymbolMode))),
        tap(([[action, elementProperties], symbolMode]) => {
          const { payload, updates } = action;
          // don't propagate changes to dependents when in symbol isolation mode
          this._rendererService.addElementProperties(payload, !symbolMode);
          this._handleUpdates(elementProperties, updates, !symbolMode);
        })
      ),
    { dispatch: false }
  );

  elementRemoteAdd$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesRemoteAdd>(actions.ELEMENT_PROPS_REMOTE_ADDED),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        tap(([action, elementProperties]) => {
          const { payload } = action;
          this.addPropertiesAndUpdateParents(payload, elementProperties);
        })
      ),
    { dispatch: false }
  );

  elementRemoteModify$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesRemoteModified>(actions.ELEMENT_PROPS_REMOTE_MODIFIED),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        tap(([action, elementProperties]) => {
          const { payload } = action;
          const updates = buildPropertyUpdatePayload(payload.id, payload);
          this._handleUpdates(elementProperties, [updates]);
        })
      ),
    { dispatch: false }
  );

  elementRemoteRemoved$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesRemoteRemoved>(actions.ELEMENT_PROPS_REMOTE_REMOVED),
        tap(({ payload }) => {
          this._rendererService.deleteElementProperties([payload.id]);
        })
      ),
    { dispatch: false }
  );

  updateElementProperties$ = createEffect(
    () =>
      this.actions$.pipe(
        ofTypeIncludingBundled<actions.ElementPropertiesUpdate>(actions.ELEMENT_PROPS_UPDATE),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        withLatestFrom(this._projectStore.pipe(select(getSymbolMode))),
        tap(([[action, elementProperties], symbolMode]) => {
          this._handleUpdates(elementProperties, action.payload, !symbolMode);
        })
      ),
    { dispatch: false }
  );

  deleteElementProperties$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesDelete>(actions.ELEMENT_PROPS_DELETE),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        withLatestFrom(this._projectStore.pipe(select(getSymbolMode))),
        tap(([[action, elementProperties], symbolMode]) => {
          const { payload, updates } = action;
          const propagate = !symbolMode;
          if (updates?.length) {
            const updateMap = getModelsForUpdates(updates, elementProperties);
            this._rendererService.updateElementProperties(updateMap, false, propagate);
          }
          if (payload) {
            const ids = payload.map((model) => model.id);
            this._rendererService.deleteElementProperties(ids, propagate);
          }
        })
      ),
    { dispatch: false }
  );

  fitToBoundsOnProjectQuerySuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.PROJECT_CONTENT_QUERY_SUCCESS),
        tap(() => this._rendererService.setPropertiesLoaded(true))
      ),
    { dispatch: false }
  );

  /**
   * Inspect undone and redone bundled actions and pass undone/redone result
   * to renderer.
   */

  undoRedoElemProps$ = createEffect(
    () =>
      this.actions$.pipe(
        ofUndoRedo<
          actions.ElementPropertiesUpdate,
          actions.ElementPropertiesDelete,
          actions.ElementPropertiesCreate
        >(
          this._projectStore,
          actions.ELEMENT_PROPS_UPDATE,
          actions.ELEMENT_PROPS_DELETE,
          actions.ELEMENT_PROPS_CREATE
        ),
        withLatestFrom(this._projectStore.pipe(select(getSymbolMode))),
        map(([[historyAction, destState, revertedActions], symbolMode]) => {
          const { elementProperties } = destState.elementProperties;
          const isUndo = historyAction.type === actions.HISTORY_UNDO;

          // Note: Update/Delete/Create are not mutually exclusive (we can have an bundled undoable that consists of any number of these.)
          const [revertedUpdateAction, revertedDeleteAction, revertedCreateAction] =
            revertedActions;
          const revertedUpdates: cd.IPropertiesUpdatePayload[] = [];
          const propagate = !symbolMode;
          // whether undoing or redoing an update. We just set what is now currently in store
          if (revertedUpdateAction) {
            const { payload } = revertedUpdateAction;
            revertedUpdates.push(...payload);
          }

          if (revertedDeleteAction) {
            const { payload, updates } = revertedDeleteAction;
            revertedUpdates.push(...(updates || []));

            if (isUndo) {
              this.addPropertiesAndUpdateParents(payload, elementProperties, propagate);
            } else {
              const deletedIds = payload.map((model) => model.id);
              this._rendererService.deleteElementProperties(deletedIds, propagate);
            }
          }

          if (revertedCreateAction) {
            const { payload, updates } = revertedCreateAction;
            revertedUpdates.push(...(updates || []));

            if (isUndo) {
              const deletedIds = payload.map((model) => model.id);
              this._rendererService.deleteElementProperties(deletedIds, propagate);
            } else {
              this.addPropertiesAndUpdateParents(payload, elementProperties, propagate);
            }
          }

          // revertedUpates can come from an update, a delete, or a create, regardless of which, send reversion here.
          if (revertedUpdates.length > 0) {
            const undonePropIds = revertedUpdates.map(({ elementId }) => elementId);

            // if the reverted update contained any changes to childIds, we need to force recompile
            // since the structure of the template tree has changed
            const forceRecompile = updatesRequireRecompile(revertedUpdates);

            // elements can be created via update, so when undoing we need to determine if
            // which elements need to be deleted vs updated in renderer
            const deletedIds = new Set<string>();
            const updates: cd.ElementPropertiesMap = {};

            for (const elementId of undonePropIds) {
              const properties = elementProperties[elementId];
              // if properties exists in store, pass them to renderer, else delete in renderer
              properties ? (updates[elementId] = properties) : deletedIds.add(elementId);
            }
            this._rendererService.updateElementProperties(updates, forceRecompile, propagate);
            this._rendererService.deleteElementProperties(Array.from(deletedIds), propagate);
          }
        })
      ),
    { dispatch: false }
  );

  /**
   * Reset renderer when disconnecting project
   */

  reset$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DisconnectProject>(actions.DISCONNECT_PROJECT),
        tap(() => this._rendererService.reset())
      ),
    { dispatch: false }
  );

  previewMode$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<RouterNavigatedAction>(ROUTER_NAVIGATION),
        map((action) => {
          const { url } = action.payload.routerState;
          return url.includes(config.Route.Preview) || url.includes(config.Route.Embed);
        }),
        distinctUntilChanged(),
        tap((previewMode) => this._rendererService.setPreviewMode(previewMode)),
        withLatestFrom(this._projectStore.pipe(select(getElementPropertiesLoaded))),
        filter(([previewMode, loaded]) => loaded === true && previewMode === false),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        // This is important to reset element properties when exiting preview
        // since the user may have interacted with the perview which updated its internal state
        tap(([, elementProperties]) => {
          // Recompile must be called to ensure symbols get reset
          const recompile = true;
          this._rendererService.updateElementProperties(elementProperties, recompile);
        })
        // One potential optimization would be to detect if the user performed any
        // actions in preview and ignore this update
      ),
    { dispatch: false }
  );

  setAll$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesSetAll | actions.ElementPropertiesReplaceAll>(
          actions.ELEMENT_PROPS_SET_ALL,
          actions.ELEMENT_PROPS_REPLACE_ALL
        ),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        map(([, elementProperties]) => {
          // when we get set all action (from health check or syncing on visbility change)
          // send all element properties renderer and recompile everything
          this._rendererService.updateElementProperties(elementProperties, true, false);
        })
      ),
    { dispatch: false }
  );

  addCodeComponents$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentRemoteAdd | actions.CodeComponentCreate>(
          actions.CODE_COMPONENT_REMOTE_ADD,
          actions.CODE_COMPONENT_CREATE
        ),
        switchMap((action) => {
          const { codeComponents } = action;
          const jsBlob$ = this._getCodeComponentJsBlobs(codeComponents);
          return forkJoin([of(codeComponents), jsBlob$]);
        }),
        map(([codeComponents, jsBlobs]) =>
          this._rendererService.addCodeComponents(codeComponents, jsBlobs)
        )
      ),
    { dispatch: false }
  );

  updateCodeComponent$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentUpdate>(actions.CODE_COMPONENT_UPDATE),
        withLatestFrom(this._projectStore.pipe(select(selectCodeComponents))),
        switchMap(([action, codeComponents]) => {
          const { id, update } = action;
          const { jsBundleStoragePath } = update;
          const codeCmp = codeComponents[id];
          const updatedJSBlobs$ =
            codeCmp && jsBundleStoragePath
              ? this._getCodeComponentJsBlobs([codeCmp])
              : of(undefined);
          return forkJoin([of(codeCmp), updatedJSBlobs$]);
        }),
        map(([codeCmp, updatedJsBlobs]) => {
          if (!codeCmp) return;
          const jsBlob = updatedJsBlobs ? updatedJsBlobs[codeCmp.id] : undefined;
          this._rendererService.updateCodeComponent(codeCmp, jsBlob);
        })
      ),
    { dispatch: false }
  );

  undoRedoCodeComponent$ = createEffect(
    () =>
      this.actions$.pipe(
        ofUndoRedo<actions.CodeComponentUpdate>(this._projectStore, actions.CODE_COMPONENT_UPDATE),
        withLatestFrom(this._projectStore.pipe(select(selectCodeComponents))),
        map(([[, , [updateAction]], codeComponents]) => {
          if (!updateAction) return;
          const codeCmp = codeComponents[updateAction.id];
          if (codeCmp) this._rendererService.updateCodeComponent(codeCmp);
        })
      ),
    { dispatch: false }
  );

  deleteCodeComponents$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentDelete>(actions.CODE_COMPONENT_DELETE),
        map((action) => this._rendererService.deleteCodeComponents([action.codeComponent.id]))
      ),
    { dispatch: false }
  );

  deleteDataset$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.DatasetDelete>(actions.DATASET_DELETE),
        tap((action) => this._rendererService.removeDatasets([action.dataset.id]))
      ),
    { dispatch: false }
  );

  private addPropertiesAndUpdateParents(
    payload: cd.PropertyModel[],
    props: cd.ElementPropertiesMap,
    propagate: boolean = false
  ) {
    this._rendererService.addElementProperties(payload, propagate);
    // Collect all parentIds from payload, and create a  properties update for the parent in the renderer
    const parentUpdates = buildParentUpdatesFromAddedChildren(payload, props);
    if (!parentUpdates) return;
    this._rendererService.updateElementProperties(parentUpdates);
  }

  private _handleUpdates = (
    elementProperties: cd.ElementPropertiesMap,
    updates?: cd.IPropertiesUpdatePayload[],
    propagateChanges = true
  ) => {
    if (!updates) return;
    const forceRecompile = updatesRequireRecompile(updates);
    // updates have already been fully merged by reducer,
    // so just grab models from elementProperties for elements that were updated
    const updateMap = getModelsForUpdates(updates, elementProperties);
    this._rendererService.updateElementProperties(updateMap, forceRecompile, propagateChanges);
  };

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
