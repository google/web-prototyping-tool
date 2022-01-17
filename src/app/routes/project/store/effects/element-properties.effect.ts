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
// prettier-ignore
import { switchMap, withLatestFrom, map, tap, bufferTime, filter, catchError, retry, observeOn, } from 'rxjs/operators';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';
import { RETRY_ATTEMPTS } from 'src/app/database/database.utils';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { actionForTypeAndElement } from '../../components/properties/actions-panel/action-panel.utils';
import { RecordActionService } from '../../services/record-action/record-action.service';
import { ofUndoRedo, ofTypeIncludingBundled } from '../../utils/history-ngrx.utils';
import { InteractionService } from '../../services/interaction/interaction.service';
import { getElementProperties } from '../selectors/element-properties.selector';
import {
  buildBaseStylePropsUpdate,
  buildInsertLocation,
  buildPropertyUpdatePayload,
  getElementBaseStyles,
} from 'cd-common/utils';
import { ClipboardService } from '../../services/clipboard/clipboard.service';
import { getCurrentActivity, getProject, getUserIsProjectEditor } from '../selectors';
import { unGroupElements, groupElements } from '../../utils/group.utils';
import { SelectionToggleElements } from '../actions/selection.action';
import { exitZone, enterZone } from '../../utils/store.utils';
import { PanelConfig } from '../../configs/project.config';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { from, of, asyncScheduler, EMPTY } from 'rxjs';
import { Injectable, NgZone } from '@angular/core';
import { IProjectState } from '../reducers/index';
import { Store, select } from '@ngrx/store';
import { deepCopy } from 'cd-utils/object';
import { AnalyticsEvent } from 'cd-common/analytics';
import { clamp } from 'cd-utils/numeric';
import * as boardActions from '../actions/board.action';
import * as actions from '../actions/element-properties.action';
import * as utils from '../../utils/element-properties.utils';
import * as panelAction from '../actions/panels.action';
import * as models from 'cd-common/models';
import * as cd from 'cd-interfaces';

const DATABASE_BATCH_TIMEOUT = 1000;
const ORDER_UP_KEY = ']';
const CLONE_TOAST: cd.IToast = {
  id: 'clone',
  iconName: 'lock',
  message: 'Clone this project to save changes.',
};

@Injectable()
export class ElementPropertiesEffects {
  constructor(
    private actions$: Actions,
    private _recordSerivce: RecordActionService,
    private _analyticsService: AnalyticsService,
    private _projectStore: Store<IProjectState>,
    private _clipboardService: ClipboardService,
    private _databaseChangesService: DatabaseChangesService,
    private _toastService: ToastsService,
    private _interactionService: InteractionService,
    private _zone: NgZone
  ) {}

  /**
   * The Set all action/effect is used when sync'ing local database with remote.
   * It creates a database write operation for all elements in the elementProperties map, and
   * adds additional delete operations for any computed deletedIds
   */

  setAllInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesSetAll>(actions.ELEMENT_PROPS_SET_ALL),
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        map(([action]) => action),
        filter((action) => action.updateDb === true),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        filter(([, proj]) => proj !== undefined),
        switchMap(([action, project]) => {
          if (!project) return EMPTY;
          const { elementProperties, deletedIds } = action;
          return from(
            this._databaseChangesService.syncAllElements(project, elementProperties, deletedIds)
          );
        }),
        retry(RETRY_ATTEMPTS),
        catchError(() => of(new actions.ElementPropertiesUpdateFailure()))
      ),
    { dispatch: false }
  );

  /**
   * When new element data document is successfully created locally. Save it to firestore.
   * Also, if it is a root element document, update project data to save list of symbolIds/boardIds
   */

  createInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesCreate>(actions.ELEMENT_PROPS_CREATE),
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        map(([action]) => action),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        filter(([, proj]) => proj !== undefined),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        switchMap(([[action, project], elementProperties]) => {
          if (!project) return EMPTY;
          const { payload, updates, deletions } = action;
          return from(
            this._databaseChangesService.modifyElements(
              project,
              elementProperties,
              payload,
              updates,
              deletions
            )
          );
        }),
        retry(RETRY_ATTEMPTS),
        catchError(() => of(new actions.ElementPropertiesUpdateFailure()))
      ),
    { dispatch: false }
  );

  /**
   * When new element data is updated locally. Save it to firestore
   */

  updateInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofTypeIncludingBundled<actions.ElementPropertiesUpdate>(actions.ELEMENT_PROPS_UPDATE),
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        filter(([, editor]) => {
          if (!editor) this._toastService.addToast(CLONE_TOAST);
          return editor && this._recordSerivce.isRecording === false;
        }),
        map(([action]) => action),
        // Run the buffer outside angular's change detection
        bufferTime(DATABASE_BATCH_TIMEOUT, exitZone(this._zone, asyncScheduler)),
        filter((updates: actions.ElementPropertiesUpdate[]) => updates.length > 0),
        observeOn(enterZone(this._zone, asyncScheduler)),
        // Re-enter Angular's zone
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        switchMap(([bufferedActions, elementProperties]) => {
          const allUpdates = bufferedActions.flatMap((a) => a.payload);
          return from(this._databaseChangesService.updateElements(elementProperties, allUpdates));
        }),
        retry(RETRY_ATTEMPTS),
        catchError(() => of(new actions.ElementPropertiesUpdateFailure()))
      ),
    { dispatch: false }
  );

  /**
   * When new element data is deleted locally. Delete it from firestore
   * Also, if it is a board document, update project data to save list of boardIds
   */

  deleteInDB$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesDelete>(actions.ELEMENT_PROPS_DELETE),
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        map(([action]) => action),
        withLatestFrom(this._projectStore.pipe(select(getProject))),
        filter(([, proj]) => proj !== undefined),
        withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
        switchMap(([[action, project], elementProperties]) => {
          if (!project) return EMPTY;
          const { payload, updates } = action;
          return from(
            this._databaseChangesService.deleteElements(
              project,
              elementProperties,
              payload,
              updates
            )
          );
        }),
        retry(RETRY_ATTEMPTS),
        catchError(() => of(new actions.ElementPropertiesUpdateFailure()))
      ),
    { dispatch: false }
  );

  // Inspect undone and redone actions (bundled or not) and pass undone/redone result to database.

  undoRedoInDB$ = createEffect(
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
        withLatestFrom(this._projectStore.pipe(select(getUserIsProjectEditor))),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === false),
        map(([action]) => action),
        // Note: Update/Delete/Create are not mutually exclusive (we can have an bundled undoable that consists of (all or some of) these.)
        switchMap(([, destState, [undoRedoCreate, undoRedoUpdate, undoRedoDelete]]) => {
          const { elementProperties: elementProps } = destState.elementProperties;
          const { project } = destState.projectData;
          if (!project) return EMPTY;
          const createActionModels = undoRedoCreate?.payload || [];
          const createActionUpdates = undoRedoCreate?.updates || [];
          const updateActionUpdates = undoRedoUpdate?.payload || [];
          const deleteActionModels = undoRedoDelete?.payload || [];
          const deleteActionUpdates = undoRedoDelete?.updates || [];
          const allUpdates = [
            ...createActionUpdates,
            ...updateActionUpdates,
            ...deleteActionUpdates,
          ];
          return from(
            this._databaseChangesService.modifyElements(
              project,
              elementProps,
              createActionModels,
              allUpdates,
              deleteActionModels
            )
          );
        }),
        retry(RETRY_ATTEMPTS),
        catchError(() => of(new actions.ElementPropertiesUpdateFailure()))
      ),
    { dispatch: false }
  );

  // When an element is deleted, determine all of its children and delete them also

  deleteElementAndChildren$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesDeleteElementsAndChildren>(
        actions.ELEMENT_PROPS_DELETE_ELEMENTS_AND_CHILDERN
      ),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      switchMap(([action, elementProperties]) => {
        const { payload } = action;
        const { propertyModels } = payload;
        if (!propertyModels) return [];

        const ids = propertyModels.map((m) => m.id);
        const modelsAndChildren = models.getModelsAndChildren(ids, elementProperties);
        const deleteAction = new actions.ElementPropertiesDelete(modelsAndChildren, true);

        /// Auto Select Siblings
        const [first] = modelsAndChildren;
        const parentId = first?.parentId;
        const parentProps = parentId && elementProperties[parentId];

        if (parentProps && parentId) {
          const { childIds } = parentProps;
          const selectionId = utils.getSiblingIdOrParent(first.id, parentId, childIds, ids);
          return [deleteAction, new SelectionToggleElements([selectionId])];
        }

        /// Default behavior
        return [deleteAction];
      })
    )
  );

  duplicate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesDuplicate>(actions.ELEMENT_PROPS_DUPLICATE),
        tap((action) => {
          const { propertyModels } = action.payload;
          if (!propertyModels) return;
          this._clipboardService.duplicateModels(propertyModels);
        })
      ),
    { dispatch: false }
  );

  toggleVisibility$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesToggleVisibility>(actions.ELEMENT_PROPS_TOGGLE_VISIBILITY),
      map(({ payload }) => payload.propertyModels || []),
      filter((propertyModels) => propertyModels.length > 0),
      map((propertyModels) => {
        const hidden = utils.areAnyElementsVisible(propertyModels);
        return propertyModels.map((propertyModel) => ({
          elementId: propertyModel.id,
          properties: { inputs: { hidden } },
        }));
      }),
      map((updates) => new actions.ElementPropertiesUpdate(updates))
    )
  );

  groupElements$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesGroupElements>(actions.ELEMENT_PROPS_GROUP_ELEMENTS),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      withLatestFrom(this._projectStore.pipe(select(getCurrentActivity))),
      switchMap(([[action, elementProperties], currentActivity]) => {
        const { payload } = action;
        const { propertyModels, layout } = payload;
        const configLayout = action?.config?.additionalParams?.layout;
        const layoutMode = configLayout || layout || cd.LayoutMode.Auto;

        // only allow grouping if there are multiple elements and none are boards
        if (!propertyModels) return [];
        const hasBoards = models.hasBoards(propertyModels);
        const isValidGroup = propertyModels.length > 0 && !hasBoards;

        if (!isValidGroup) return [];

        const { renderRects } = this._interactionService;
        const group = groupElements(propertyModels, elementProperties, renderRects, layoutMode);

        const { groupElementId, updates } = group;
        const isShowingLayersTree = currentActivity?.id === PanelConfig.Layers.id;
        const showAction = isShowingLayersTree
          ? []
          : [new panelAction.PanelSetActivityForced(PanelConfig.Layers, {})];

        return [
          ...showAction,
          new actions.ElementPropertiesUpdate(updates),
          new SelectionToggleElements([groupElementId]),
        ];
      })
    )
  );

  unGroupElements$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesUngroupElements>(actions.ELEMENT_PROPS_UNGROUP_ELEMENTS),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      switchMap(([action, elementProperties]) => {
        const { payload } = action;
        const { propertyModels } = payload;
        if (!propertyModels) return [];
        const { renderRects } = this._interactionService;
        const ungrouped = unGroupElements(propertyModels, elementProperties, renderRects);
        const { deletions, updates, unGroupedIds } = ungrouped;

        if (deletions.length === 0) return []; // don't trigger an action if no changes

        return [
          new actions.ElementPropertiesDelete(deletions, true, updates),
          new SelectionToggleElements(unGroupedIds),
        ];
      })
    )
  );

  createPortalFromElements$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesCreatePortalFromElements>(
        actions.ELEMENT_PROPS_CREATE_PORTAL_FROM_ELEMENTS
      ),
      map(({ payload }) => payload.propertyModels || []),
      filter((propertyModels) => propertyModels.length > 0),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      withLatestFrom(this._projectStore.pipe(select(getProject))),
      switchMap(([[propertyModels, elementProperties], project]) => {
        if (!project) return EMPTY;
        const [element] = propertyModels;
        const rect = this._interactionService.renderRectForId(element.id);
        if (!rect) return EMPTY;

        const { frame } = rect;
        const board = utils.createBoardFromElement(frame, project.id, element);
        const childModels = element.childIds.map(
          (id) => elementProperties[id]
        ) as cd.PropertyModel[];
        const boardContent = models.duplicateModelsAndChildren(childModels, elementProperties);
        const portal = utils.createPortal(project.id, board.id, frame, element);

        // TODO : Add this back in once BundledUndoableActions are figured out
        // return new BundledUndoableActions(
        //   new boardActions.BoardCreate([board], [boardContent], true, undefined, false, true),
        //   new actions.ElementPropertiesReplace(element.id, portal, true)
        // );
        return [
          new boardActions.BoardCreate([board], [boardContent], true, undefined, false, true),
          new actions.ElementPropertiesReplace(element.id, portal, true, false),
        ];
      })
    )
  );

  replaceElement$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesReplace>(actions.ELEMENT_PROPS_REPLACE),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      switchMap(([action, elementProperties]) => {
        const { deleteId: elementId, replaceElement, mergeStyleOverrides } = action;
        const ids = [elementId];
        const modelsAndChildren = models.getModelsAndChildren(ids, elementProperties);
        const [oldElement] = modelsAndChildren;
        const mergedElement = utils.replaceElementAndPreserveRelevantProperties(
          oldElement,
          replaceElement,
          mergeStyleOverrides
        );

        const addIds = [mergedElement.id];
        const addLocation = buildInsertLocation(elementId, cd.InsertRelation.Before);
        const elemsToAdd = [mergedElement];
        const addUpdates = models.insertElements(
          addIds,
          addLocation,
          elementProperties,
          elemsToAdd
        );
        const updates = [...addUpdates];
        const deleteAction = new actions.ElementPropertiesDelete(modelsAndChildren, true, updates);
        const { id: mergedElementId } = mergedElement;
        return [deleteAction, new SelectionToggleElements([mergedElementId])];
      })
    )
  );

  addInteraction$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesAddInteraction>(actions.ELEMENT_PROPS_ADD_INTERACTION),
      switchMap(({ config, payload }) => {
        const props = payload.propertyModels ?? [];
        if (props.length === 0 || !config?.id) return [];
        const elem = props[0];
        const actionType = config.id as cd.ActionType;
        const interaction = actionForTypeAndElement(actionType, elem);
        const updates = props.reduce<cd.IPropertiesUpdatePayload[]>((acc, element) => {
          const cloneActions = deepCopy(element.actions);
          const properties = { actions: [interaction, ...cloneActions] };
          const update = buildPropertyUpdatePayload(element.id, properties);
          acc.push(update);
          return acc;
        }, []);

        this._analyticsService.logEvent(AnalyticsEvent.ActionCreate, { name: actionType });
        const isRecording = actionType === cd.ActionType.RecordState;
        const panelStateAction = isRecording
          ? new panelAction.PanelStartRecording(updates[0].elementId, interaction.id)
          : new panelAction.PanelSetPropertyPanelState(cd.PropertyPanelState.Actions);

        return [new actions.ElementPropertiesUpdate(updates), panelStateAction];
      })
    )
  );

  /**
   * Change the z-order for absolute position elements
   * When the CMD + [ or ] is pressed
   */

  orderChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesOrderChange>(actions.ELEMENT_PROPS_ORDER_CHANGE),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      switchMap(([action, _elementProperties]) => {
        const evt = action.event as KeyboardEvent;
        const up = evt?.key === ORDER_UP_KEY;
        const { propertyModels } = action.payload;
        if (!propertyModels || propertyModels.length > 1 || !evt.key) return [];
        const [first] = propertyModels;
        const isRelative = utils.hasRelativePosition(first);
        if (isRelative) return [];
        const zvalue = getElementBaseStyles(first)?.zIndex ?? 0;
        const idx = Number(zvalue);
        const increment = up ? 1 : -1;
        const value = idx + increment;
        const zIndex = value > 0 ? clamp(value, 1, Number.MAX_SAFE_INTEGER) : null;
        const style: cd.IStyleDeclaration = { zIndex };
        const update = buildBaseStylePropsUpdate(first.id, style);
        return [new actions.ElementPropertiesUpdate([update])];
      })
    )
  );

  /**
   * Moves an element relative to siblings when arrow keys are pressed
   * or as pixel values for absolute positioned elements
   */

  move$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesMove>(actions.ELEMENT_PROPS_MOVE),
      withLatestFrom(this._projectStore.pipe(select(getElementProperties))),
      switchMap(([action, elementProperties]) => {
        const { propertyModels } = action.payload;
        const evt = action.event as KeyboardEvent;
        if (!propertyModels || propertyModels.length > 1 || !evt.key) return [];
        const [first] = propertyModels;
        const isRelative = utils.hasRelativePosition(first);
        return isRelative
          ? utils.moveElementsRelative(elementProperties, first, evt)
          : utils.moveElementsAbsolute(first, evt);
      })
    )
  );

  selectParent$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesSelectParent>(actions.ELEMENT_PROPS_SELECT_PARENT),
      map(({ payload }) => payload.propertyModels || []),
      map((propertyModels) => propertyModels.length === 1 && propertyModels[0]),
      map((first) => (first && first.parentId) || ''),
      filter((parentId) => parentId !== undefined),
      map((parentId) => new SelectionToggleElements([parentId]))
    )
  );
}
