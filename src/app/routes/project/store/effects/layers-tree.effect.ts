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

import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { LayersTreeService } from '../../services/layers-tree/layers-tree.service';

import * as cd from 'cd-interfaces';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import {
  ElementPropertiesUpdate,
  ELEMENT_PROPS_UPDATE,
} from '../actions/element-properties.action';

// Check to see if an array of updates contains changes to any childIds
// From this we will know if structure of tree has changed
const containChildIdUpdates = (updates: cd.IPropertiesUpdatePayload[]): boolean => {
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
    private _projectContentService: ProjectContentService
  ) {}

  // TODO: Provide mechanism to only update tree if childIds have changed
  createOrDelete$ = createEffect(
    () =>
      this._projectContentService.elementContent$.pipe(
        filter((content) => {
          const { idsCreatedInLastChange, idsDeletedInLastChange } = content;
          return Boolean(idsCreatedInLastChange.size || idsDeletedInLastChange.size);
        }),
        tap(() => this._layersTreeService.updateTreeNodes())
      ),
    { dispatch: false }
  );

  updateElementProperties$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ElementPropertiesUpdate>(ELEMENT_PROPS_UPDATE),
        filter((action) => containChildIdUpdates(action.payload)),
        tap(() => this._layersTreeService.updateTreeNodes())
      ),
    { dispatch: false }
  );
}
