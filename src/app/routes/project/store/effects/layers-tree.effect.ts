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

import { createEffect, Actions, ofType } from '@ngrx/effects';
import { tap, filter } from 'rxjs/operators';
import { IProjectState } from '../reducers/index';
import { Store } from '@ngrx/store';
import { Injectable } from '@angular/core';
import { LayersTreeService } from '../../services/layers-tree/layers-tree.service';
import { ofUndoRedo } from '../../utils/history-ngrx.utils';
import * as actions from '../actions';
import * as cd from 'cd-interfaces';

// Check to see if an array of updates contains changes to any childIds
// From this we will know if structure of tree has changed
export const containChildIdUpdates = (updates: cd.IPropertiesUpdatePayload[]): boolean => {
  return updates.some((update) => !!update.properties.childIds);
};
/**
 * This is a set of effects to update the layers tree whenever structural updates are made
 */
@Injectable()
export class LayersTreeEffects {
  constructor(
    private actions$: Actions,
    private _layersTreeService: LayersTreeService,
    private _projectStore: Store<IProjectState>
  ) {}

  createOrDelete$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          actions.ELEMENT_PROPS_CREATE,
          actions.ELEMENT_PROPS_REMOTE_ADDED,
          actions.ELEMENT_PROPS_DELETE
        ),
        tap(() => this._layersTreeService.updateTreeNodes())
      ),
    { dispatch: false }
  );

  updateElementProperties$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesUpdate>(actions.ELEMENT_PROPS_UPDATE),
        filter((action) => containChildIdUpdates(action.payload)),
        tap(() => this._layersTreeService.updateTreeNodes())
      ),
    { dispatch: false }
  );

  undoRedo$ = createEffect(
    () =>
      this.actions$.pipe(
        ofUndoRedo<
          actions.ElementPropertiesCreate,
          actions.ElementPropertiesUpdate,
          actions.ElementPropertiesDelete
        >(
          this._projectStore,
          actions.ELEMENT_PROPS_CREATE,
          actions.ELEMENT_PROPS_UPDATE,
          actions.ELEMENT_PROPS_DELETE
        ),
        filter(
          ([, _destState, [revertedCreateAction, revertedUpdateAction, revertedDeleteAction]]) => {
            if (revertedCreateAction || revertedDeleteAction) return true;
            if (revertedUpdateAction && containChildIdUpdates(revertedUpdateAction.payload))
              return true;
            return false;
          }
        ),
        tap(() => this._layersTreeService.updateTreeNodes())
      ),
    { dispatch: false }
  );
}
