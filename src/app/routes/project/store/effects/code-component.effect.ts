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

import type * as cd from 'cd-interfaces';
import { switchMap, withLatestFrom, filter, retry, map, tap } from 'rxjs/operators';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { IProjectState } from '../reducers/index';
import { Store, select } from '@ngrx/store';
import { RecordActionService } from '../../services/record-action/record-action.service';
import {
  getProject,
  getElementProperties,
  selectCodeComponents,
  getUserIsProjectEditor,
} from '../selectors';
import * as actions from '../actions/code-component.action';
import { RETRY_ATTEMPTS } from 'src/app/database/database.utils';
import { PropertiesService } from '../../services/properties/properties.service';
import { getModels, getModelsAndChildren } from 'cd-common/models';
import { ElementPropertiesDelete, ElementPropertiesUpdate } from '../actions';
import {
  mergeInputUpdatesIntoCodeComponentInstance,
  getInstancesOfCodeComponent,
} from 'cd-common/utils';
import { of } from 'rxjs';
import { ofUndoRedo } from '../../utils/history-ngrx.utils';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';

@Injectable()
export class CodeComponentEffects {
  constructor(
    private actions$: Actions,
    private _databaseChangesService: DatabaseChangesService,
    private _propsService: PropertiesService,
    private _recordSerivce: RecordActionService,
    private _projectStore: Store<IProjectState>
  ) {}

  createInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentCreate>(actions.CODE_COMPONENT_CREATE),
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        map(([action]) => action),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        filter(([, proj]) => proj !== undefined),
        withLatestFrom(this._projectStore.pipe(select(selectCodeComponents))),
        switchMap(([[action], codeComponentDictionary]) => {
          const { codeComponents } = action;
          // Ensure all components are present in the Store before creating
          const codeCmpLookups = codeComponents.map((c) => codeComponentDictionary[c.id]);
          const filteredCodeCmps = codeCmpLookups.filter((c) => !!c) as cd.ICodeComponentDocument[];
          return this._databaseChangesService.createCodeComponents(filteredCodeCmps);
        }),
        retry(RETRY_ATTEMPTS)
      ),
    { dispatch: false }
  );

  updateInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentUpdate>(actions.CODE_COMPONENT_UPDATE),
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        map(([action]) => action),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        filter(([, proj]) => proj !== undefined),
        withLatestFrom(this._projectStore.pipe(select(selectCodeComponents))),
        switchMap(([[action], codeComponentDictionary]) => {
          const codeComponent = codeComponentDictionary[action.id];
          if (!codeComponent) return of();
          return this._databaseChangesService.updateCodeComponent(codeComponent);
        }),
        retry(RETRY_ATTEMPTS)
      ),
    { dispatch: false }
  );

  deleteInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.CodeComponentDelete>(actions.CODE_COMPONENT_DELETE),
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        map(([action]) => action),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        filter(([, proj]) => proj !== undefined),
        switchMap(([action]) => {
          return this._databaseChangesService.deleteCodeComponent(action.codeComponent);
        }),
        retry(RETRY_ATTEMPTS)
      ),
    { dispatch: false }
  );

  undoRedoInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofUndoRedo<actions.CodeComponentUpdate>(this._projectStore, actions.CODE_COMPONENT_UPDATE),
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        map(([action]) => action),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        filter(([, proj]) => proj !== undefined),
        withLatestFrom(this._projectStore.pipe(select(selectCodeComponents))),
        switchMap(([[historyPayload], codeComponentDictionary]) => {
          const [, , [undoneUpdate]] = historyPayload;
          if (!undoneUpdate) return of();
          const codeComponent = codeComponentDictionary[undoneUpdate.id];
          if (!codeComponent) return of();
          return this._databaseChangesService.updateCodeComponent(codeComponent);
        }),
        retry(RETRY_ATTEMPTS)
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
      withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
      filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
      map(([action]) => action),
      withLatestFrom(this._projectStore.pipe(select(getProject))),
      filter(([, proj]) => proj !== undefined),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      switchMap(([[action], elementProperties]) => {
        const { id, update } = action;
        const { properties, ...otherUpdates } = update;
        const instances = getInstancesOfCodeComponent(id, elementProperties);

        // TODO : Also need to merge in other properties: allowChildren, fitContent, etc
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
      withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
      filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
      map(([action]) => action),
      withLatestFrom(this._projectStore.pipe(select(getProject))),
      filter(([, proj]) => proj !== undefined),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
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
}
