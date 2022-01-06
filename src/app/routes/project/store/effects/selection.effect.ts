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
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { EntityType, IUserSelection } from 'cd-interfaces';
import { getIsolatedSymbolId, getSelectedIds, getSelectionState } from '../selectors';
import { Injectable } from '@angular/core';
import { IProjectState } from '../reducers';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { withLatestFrom, map, switchMap, tap, distinctUntilChanged } from 'rxjs/operators';
import * as actions from '../actions/selection.action';
import { RtcService } from 'src/app/services/rtc/rtc.service';
import { PresenceService } from 'src/app/services/presence/presence.service';
import { areSetsEqual } from 'cd-utils/object';
import { ProjectChangeCoordinator } from 'src/app/database/changes/project-change.coordinator';
import { getSiblingIdOrParent } from '../../utils/element-properties.utils';

@Injectable()
export class SelectionEffects {
  constructor(
    private actions$: Actions,
    private projectStore: Store<IProjectState>,
    private projectChangeCoordinator: ProjectChangeCoordinator,
    private projectContentService: ProjectContentService,
    private presenceService: PresenceService,
    private rtcService: RtcService
  ) {}

  /**
   * Anytime and element is toggled add/remove its associated board
   * unless there are other elements still selected that have the same associated board
   */
  toggleElement$: Observable<actions.SelectionSet> = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.SelectionToggleElements>(actions.SELECTION_TOGGLE_ELEMENTS),
      withLatestFrom(this.projectStore.pipe(select(getSelectedIds))),
      withLatestFrom(this.projectContentService.elementProperties$),
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
   * Anytime an element is recreated during undo/redo, select it.
   * Anytime a selected element is deleted during undo, move selection to its sibling or parent
   */
  updateSelectionOnUndoRedo$ = createEffect(() =>
    this.projectChangeCoordinator.undoRedoChangeProcessed$.pipe(
      withLatestFrom(this.projectStore.pipe(select(getSelectedIds))),
      switchMap(([priorElementContent, selectedIds]) => {
        const elementContent = this.projectContentService.elementContent$.getValue();
        const { SelectionToggleElements } = actions;
        const { idsCreatedInLastChange, idsDeletedInLastChange } = elementContent;

        if (idsCreatedInLastChange.size) {
          const createdIds = Array.from(idsCreatedInLastChange);
          return [new SelectionToggleElements(createdIds)];
        }

        if (!idsDeletedInLastChange.size) return [];

        const currSelectedIds = Array.from(selectedIds);
        const deletedSelection = currSelectedIds.filter((id) => idsDeletedInLastChange.has(id));
        if (!deletedSelection.length) return [];

        const [firstId] = deletedSelection;
        const props = priorElementContent.records[firstId];
        if (!props?.parentId) return [];
        const { parentId } = props;
        const parentProps = priorElementContent.records[parentId];
        if (!parentProps) return [];
        const { childIds } = parentProps;
        const deletedIds = Array.from(idsDeletedInLastChange);
        const selectionId = getSiblingIdOrParent(firstId, parentId, childIds, deletedIds);
        return [new SelectionToggleElements([selectionId])];
      })
    )
  );

  broadcastSelectionToPeers$ = createEffect(
    () =>
      this.projectStore.pipe(
        select(getSelectionState),
        withLatestFrom(this.projectStore.pipe(select(getIsolatedSymbolId))),
        withLatestFrom(this.projectContentService.elementProperties$),
        distinctUntilChanged((prev, curr) => {
          const [[prevSelectionState]] = prev;
          const [[currSelectionState]] = curr;
          return areSetsEqual(prevSelectionState.ids, currSelectionState.ids);
        }),
        tap(([[selectionState, isolatedSymbolId], elementProperties]) => {
          const { ids, outletFramesSelected } = selectionState;
          const { sessionId } = this.presenceService;
          const selectedIds = Array.from(ids);

          const selectedIdsByOutlet = selectedIds.reduce<Record<string, string[]>>((acc, id) => {
            const rootId = elementProperties[id]?.rootId;
            if (!rootId) return acc;
            const outletIds = acc[rootId] || [];
            const updatedIds = [...outletIds, id];
            acc[rootId] = updatedIds;
            return acc;
          }, {});

          const selection: IUserSelection = {
            sessionId,
            selectedIdsByOutlet,
            outletFramesSelected,
            isolatedSymbolId,
          };
          this.rtcService.broadcastSelectionMessage(selection);
        })
      ),
    { dispatch: false }
  );
}
