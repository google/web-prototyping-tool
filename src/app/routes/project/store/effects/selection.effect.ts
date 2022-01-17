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

import { checkForRoots, filterRoots, isSymbolInstance, lookupElementIds } from 'cd-common/models';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { ElementPropertiesDelete, ELEMENT_PROPS_DELETE } from '../actions';
import { EntityType } from 'cd-interfaces';
import { getSelectedIds } from '../selectors';
import { Injectable } from '@angular/core';
import { IProjectState } from '../reducers';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { withLatestFrom, map, filter } from 'rxjs/operators';
import * as actions from '../actions/selection.action';
import * as propertiesSelectors from '../selectors/element-properties.selector';

@Injectable()
export class SelectionEffects {
  constructor(private actions$: Actions, private projectStore: Store<IProjectState>) {}

  /**
   * Anytime and element is toggled add/remove it associated board
   * Unless there are other elements still selected that have the same associated board
   */

  toggleElement$: Observable<actions.SelectionSet> = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.SelectionToggleElements>(actions.SELECTION_TOGGLE_ELEMENTS),
      withLatestFrom(this.projectStore.pipe(select(getSelectedIds))),
      withLatestFrom(this.projectStore.pipe(select(propertiesSelectors.getElementProperties))),
      map(([[action, selectedIds], elementProperties]) => {
        const { ids, appendToSelection, allowToggleDeselect } = action;
        const hasRootElements = checkForRoots(new Set(ids), elementProperties);
        const areRootsCurrentlySelected = checkForRoots(selectedIds, elementProperties);

        // filter ids to either only rootElements or only not rootElements;
        const filteredIds = filterRoots(ids, elementProperties, hasRootElements);

        // If types of current selection and new selection are the same, and append is true
        // start with current selection. otherwise start with new set.
        const updatedSelection: Set<string> =
          hasRootElements === areRootsCurrentlySelected && appendToSelection
            ? new Set(selectedIds)
            : new Set();

        for (const id of filteredIds) {
          const deselect = allowToggleDeselect && selectedIds.has(id);

          if (deselect) {
            updatedSelection.delete(id);
          } else {
            updatedSelection.add(id);
          }
        }

        const models = lookupElementIds(filteredIds, elementProperties);
        const symbolInstancesSelected =
          !hasRootElements && models.every((model) => isSymbolInstance(model));

        const codeComponentInstancesSelected =
          !hasRootElements && models.every((model) => model.isCodeComponentInstance);

        return new actions.SelectionSet(
          updatedSelection,
          hasRootElements,
          EntityType.Element,
          symbolInstancesSelected,
          codeComponentInstancesSelected
        );
      })
    )
  );

  /**
   * When an element, make sure it cleared out of selection
   */

  deletedSelection$: Observable<actions.SelectionSet | actions.SelectionDeselectAll> = createEffect(
    () =>
      this.actions$.pipe(
        ofType<ElementPropertiesDelete>(ELEMENT_PROPS_DELETE),
        filter(({ ignoreDeselect }) => !ignoreDeselect),
        map(() => new actions.SelectionDeselectAll())
      )
  );
}
