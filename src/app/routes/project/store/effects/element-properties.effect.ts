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
import { switchMap, withLatestFrom, map, tap, filter, catchError, retry, } from 'rxjs/operators';
import { ProjectChangeCoordinator } from 'src/app/database/changes/project-change.coordinator';
import { RETRY_ATTEMPTS } from 'src/app/database/database.utils';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { actionForTypeAndElement } from '../../components/properties/actions-panel/action-panel.utils';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { RecordActionService } from '../../services/record-action/record-action.service';
import { InteractionService } from '../../services/interaction/interaction.service';
import { ClipboardService } from '../../services/clipboard/clipboard.service';
import { getCurrentActivity, getIsolatedSymbolId } from '../selectors';
import { unGroupElements, groupElements } from '../../utils/group.utils';
import { SelectionDeselectAll, SelectionToggleElements } from '../actions/selection.action';
import { PanelConfig } from '../../configs/project.config';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { of, EMPTY } from 'rxjs';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { Injectable } from '@angular/core';
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
import {
  buildBaseStylePropsUpdate,
  convertPropsUpdateToUpdateChanges,
  buildInsertLocation,
  buildPropertyUpdatePayload,
  getElementBaseStyles,
  mergeElementChangePayloads,
  createElementChangePayload,
} from 'cd-common/utils';
import { computeSymbolInputUpdates } from '../../utils/symbol-input.utils';

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
    private _projectChangeCoordinator: ProjectChangeCoordinator,
    private _projectContentService: ProjectContentService,
    private _toastService: ToastsService,
    private _interactionService: InteractionService
  ) {}

  /** Compute any symbol changes that are needed whenever an element is changed (if any) */
  private dispatchElementChangeRequest = (
    change: cd.IElementChangePayload,
    isolatedSymbolId?: string
  ) => {
    if (!isolatedSymbolId) {
      this._projectChangeCoordinator.dispatchChangeRequest([change]);
      return;
    }

    const elementContent = this._projectContentService.elementContent$.getValue();
    const symbolUpdates = computeSymbolInputUpdates(isolatedSymbolId, elementContent, change);
    const symbolChange = createElementChangePayload(undefined, symbolUpdates);
    const mergedChange = mergeElementChangePayloads([change, symbolChange]);
    this._projectChangeCoordinator.dispatchChangeRequest([mergedChange]);
  };

  /**
   *
   */
  coordinateElementChangeRequest = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesChangeRequest>(actions.ELEMENT_PROPS_CHANGE_REQUEST),
        filter(() => this._recordSerivce.isRecording === false),
        withLatestFrom(this._projectStore.pipe(select(getIsolatedSymbolId))),
        tap(([action, isolatedSymbolId]) => {
          // merge all element changes into a single IElementChangePayload so that all get
          // applied in a single operation
          const mergedChange = mergeElementChangePayloads(action.payload);
          this.dispatchElementChangeRequest(mergedChange, isolatedSymbolId);
        })
      ),
    { dispatch: false }
  );

  /**
   * When new element data document is successfully created locally. Save it to firestore.
   * Also, if it is a root element document, update project data to save list of symbolIds/boardIds
   */
  coordinateElementCreate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesCreate>(actions.ELEMENT_PROPS_CREATE),
        filter(() => this._recordSerivce.isRecording === false),
        tap((action) => {
          const { payload: sets, updates, deletions } = action;
          const type = cd.EntityType.Element;
          const changeRequestPayload: cd.IElementChangePayload = { type, sets };
          if (updates) changeRequestPayload.updates = convertPropsUpdateToUpdateChanges(updates);
          if (deletions) changeRequestPayload.deletes = deletions.map((d) => d.id);
          return this.dispatchElementChangeRequest(changeRequestPayload);
        })
      ),
    { dispatch: false }
  );

  /**
   * When new element data is updated locally. Save it to firestore
   */
  coordinateElementUpdate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesUpdate>(actions.ELEMENT_PROPS_UPDATE),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        filter(([, editor]) => {
          if (!editor) this._toastService.addToast(CLONE_TOAST);
          return editor && this._recordSerivce.isRecording === false;
        }),
        tap(([action]) => {
          const type = cd.EntityType.Element;
          const updates = convertPropsUpdateToUpdateChanges(action.payload);
          const changeRequestPayload: cd.ChangePayload = { type, updates };
          return this.dispatchElementChangeRequest(changeRequestPayload);
        })
      ),
    { dispatch: false }
  );

  /**
   * When new element data is deleted locally. Delete it from firestore
   * Also, if it is a board document, update project data to save list of boardIds
   */
  coordinateElementDelete$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ElementPropertiesDelete>(actions.ELEMENT_PROPS_DELETE),
        filter(() => this._recordSerivce.isRecording === false),
        tap((action) => {
          const type = cd.EntityType.Element;
          const { payload, updates } = action;
          const deletes = payload.map((m) => m.id);
          const changeRequestPayload: cd.ChangePayload = { type, deletes };
          if (updates) changeRequestPayload.updates = convertPropsUpdateToUpdateChanges(updates);
          return this.dispatchElementChangeRequest(changeRequestPayload);
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
      withLatestFrom(this._projectContentService.elementProperties$),
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
        return [deleteAction, new SelectionDeselectAll()];
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
      withLatestFrom(this._projectContentService.elementProperties$),
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

        const { groupElementId, changes } = group;
        const isShowingLayersTree = currentActivity?.id === PanelConfig.Layers.id;
        const showAction = isShowingLayersTree
          ? []
          : [new panelAction.PanelSetActivityForced(PanelConfig.Layers, {})];

        return [
          ...showAction,
          new actions.ElementPropertiesChangeRequest(changes),
          new SelectionToggleElements([groupElementId]),
        ];
      })
    )
  );

  unGroupElements$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ElementPropertiesUngroupElements>(actions.ELEMENT_PROPS_UNGROUP_ELEMENTS),
      withLatestFrom(this._projectContentService.elementProperties$),
      switchMap(([action, elementProperties]) => {
        const { payload } = action;
        const { propertyModels } = payload;
        if (!propertyModels) return [];
        const { renderRects } = this._interactionService;
        const ungrouped = unGroupElements(propertyModels, elementProperties, renderRects);
        const { changes, unGroupedIds } = ungrouped;

        // TODO: how to check if these changes are a no-op
        if (changes.length === 0) return []; // don't trigger an action if no changes

        return [
          new actions.ElementPropertiesChangeRequest(changes),
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
      withLatestFrom(this._projectContentService.elementProperties$),
      withLatestFrom(this._projectContentService.project$),
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

        // TODO: Add this back in once BundledUndoableActions are figured out
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
      withLatestFrom(this._projectContentService.elementProperties$),
      switchMap(([action, elementProperties]) => {
        const { deleteId: elementId, replaceElement, mergeStyleOverrides } = action;
        const ids = [elementId];
        const modelsAndChildren = models.getModelsAndChildren(ids, elementProperties);
        const deletes = modelsAndChildren.map((m) => m.id);
        const type = cd.EntityType.Element;
        const deleteChange: cd.IElementChangePayload = { type, deletes };
        const [oldElement] = modelsAndChildren;
        const mergedElement = utils.replaceElementAndPreserveRelevantProperties(
          oldElement,
          replaceElement,
          mergeStyleOverrides
        );

        const addIds = [mergedElement.id];
        const addLocation = buildInsertLocation(elementId, cd.InsertRelation.Before);
        const elemsToAdd = [mergedElement];
        const insertChange = models.insertElements(
          addIds,
          addLocation,
          elementProperties,
          elemsToAdd
        );
        const changes = [deleteChange, insertChange];
        const deleteAction = new actions.ElementPropertiesChangeRequest(changes);
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
      withLatestFrom(this._projectContentService.elementProperties$),
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
      withLatestFrom(this._projectContentService.elementProperties$),
      switchMap(([action, elementProperties]) => {
        const { propertyModels } = action.payload;
        const evt = action.event as KeyboardEvent;
        if (!propertyModels || propertyModels.length > 1 || !evt.key) return [];
        const [first] = propertyModels;
        const isRelative = utils.hasRelativePosition(first);
        const payload = isRelative
          ? utils.moveElementsRelative(elementProperties, first, evt)
          : utils.moveElementsAbsolute(first, evt);

        return [new actions.ElementPropertiesChangeRequest(payload)];
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
