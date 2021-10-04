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
import { withLatestFrom, switchMap, tap, filter, bufferTime, observeOn, map } from 'rxjs/operators';
import { select, Store, Action } from '@ngrx/store';
import { Injectable, NgZone } from '@angular/core';
import { IProjectState } from '../reducers';
import { RecordActionService } from '../../services/record-action/record-action.service';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { asyncScheduler } from 'rxjs';
import { getInteractionClipboard } from '../selectors/interaction.selector';
import { migrateRecordedActions, removeMismatchedRecordedInputs } from 'cd-common/models';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { RECORDING_TOAST } from '../../dnd-director/dnd.config';
import { AnalyticsEvent } from 'cd-common/analytics';
import { deepCopy } from 'cd-utils/object';
import * as utils from '../../utils/interaction.utils';
import * as actions from '../actions/panels.action';
import * as storeActions from '../actions';
import * as cd from 'cd-interfaces';
import { enterZone, exitZone } from 'src/app/utils/zone.utils';

const RECORD_BUFFER_TIMEOUT = 20;

@Injectable()
export class InteractionEffect {
  constructor(
    private actions$: Actions,
    private _zone: NgZone,
    private _analyticsService: AnalyticsService,
    private _recordSerivce: RecordActionService,
    private _projectStore: Store<IProjectState>,
    private _toastService: ToastsService,
    private _projectContentService: ProjectContentService
  ) {}

  pasteActions$ = createEffect(() =>
    this.actions$.pipe(
      ofType<storeActions.InteractionPasteActions>(storeActions.INTERACTION_PASTE_ACTION),
      withLatestFrom(this._projectStore.pipe(select(getInteractionClipboard))),
      withLatestFrom(this._projectContentService.elementProperties$),
      switchMap(([[{ elementId }, clipboard], elementProperties]) => {
        const props = elementProperties[elementId];
        const refId = clipboard?.refId as string;
        const sourceProps = refId && elementProperties[refId];
        if (!props || !sourceProps || (!refId && !clipboard?.actions)) return [];
        const sameType = props.elementType === sourceProps.elementType;
        const idReplacement = new Map<string, string>([[refId, elementId]]);
        const copiedActions = deepCopy(clipboard?.actions ?? []);
        const sanitizeActionInputs = removeMismatchedRecordedInputs(copiedActions, refId, sameType);
        const migrated = migrateRecordedActions(sanitizeActionInputs, idReplacement);
        const currentElementActions = props.actions || [];
        const mergedActions = [...migrated, ...currentElementActions];
        const payload = [{ elementId, properties: { actions: mergedActions } }];

        // Send each pasted action as an event
        for (const action of migrated) {
          this._analyticsService.logEvent(AnalyticsEvent.ActionCreate, { name: action.type });
        }

        return [new storeActions.ElementPropertiesUpdate(payload)];
      })
    )
  );

  startRecordingActions$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.PanelStartRecording>(actions.PANEL_START_RECORDING),
      withLatestFrom(this._projectContentService.elementProperties$),
      switchMap(([{ elementId, actionId }, elementProperties]) => {
        const elementProps = elementProperties[elementId];
        if (!elementProps) return [];

        this._recordSerivce.startRecording(elementId, actionId);
        const elementActions = elementProps.actions;

        const actionsToDispatch: Action[] = [
          new actions.PanelSetPropertyPanelState(cd.PropertyPanelState.Default),
        ];

        const activeAction = elementActions.find(
          (item) => item.id === actionId
        ) as cd.IActionBehaviorRecordState;

        const targetActions: cd.IActionStateChange[] = activeAction?.stateChanges || [];
        // Add existing state changes for this action
        if (targetActions.length > 0) {
          // Add the previously recorded values to the state change list
          this._recordSerivce.assignInitialStateChanges(targetActions);
          // Update the renderer to show the previously recorded state
          const payload = this._recordSerivce.getPropertiesUpdateFromState();

          if (payload.length) {
            const undoable = false; // Don't persist changes
            const propsUpdate = new storeActions.ElementPropertiesUpdate(payload, undoable);
            actionsToDispatch.push(propsUpdate);
          }
        }

        return actionsToDispatch;
      })
    )
  );

  stopRecordingActions$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.PanelStopRecording>(actions.PANEL_STOP_RECORDING),
      withLatestFrom(this._projectContentService.elementProperties$),
      switchMap(([, elementProperties]) => {
        const { elementId, actionId, stateChanges, propsSnapshot } =
          this._recordSerivce.stopRecording();
        this._toastService.removeToast(RECORDING_TOAST.id);
        const props = elementProperties[elementId];
        const actionsClone = props ? deepCopy(props.actions) : [];
        const elemActions = actionsClone.map((item) => {
          if (item.id === actionId) {
            (item as cd.IActionBehaviorRecordState).stateChanges = stateChanges;
          }
          return item;
        });

        const properties = { actions: elemActions } as Partial<cd.PropertyModel>;
        const payload: cd.IPropertiesUpdatePayload = { elementId, properties };

        return [
          // Reset State of element properties to before recording
          new storeActions.ElementPropertiesReplaceAll(propsSnapshot),
          // Add actions to the element which initialized this
          new storeActions.ElementPropertiesUpdate([payload]),
          // Select that element
          new storeActions.SelectionSet(new Set([elementId]), false),
          // Switch the right panel to show actions
          new actions.PanelSetPropertyPanelState(cd.PropertyPanelState.Actions),
        ];
      })
    )
  );

  recordStateChanges$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<storeActions.ElementPropertiesUpdate>(storeActions.ELEMENT_PROPS_UPDATE),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        filter(([, editor]) => editor && this._recordSerivce.isRecording === true),
        map(([action]) => action),
        // Run the buffer outside angular's change detection
        bufferTime(RECORD_BUFFER_TIMEOUT, exitZone(this._zone, asyncScheduler)),
        filter((updates: any[]) => updates.length > 0),
        observeOn(enterZone(this._zone, asyncScheduler)),
        // Re-enter Angular's zone
        withLatestFrom(this._projectContentService.elementProperties$),
        tap(([bufferedActions, _elementProperties]) => {
          // Group each change by elementId to improve processing performance
          const elementChangesMap = bufferedActions
            .filter((action) => action.undoable)
            .reduce<utils.ElementChangesMap>((acc, action) => {
              for (const { elementId, properties } of action.payload) {
                if (acc.has(elementId)) {
                  acc.get(elementId)?.push(properties);
                } else {
                  acc.set(elementId, [properties]);
                }
              }
              return acc;
            }, new Map());

          const elementChangeList = Array.from(elementChangesMap.entries());
          // Collect changes on inputs and styles
          const stateChanges = elementChangeList.reduce<cd.IActionStateChange[]>((acc, entry) => {
            const [id, props] = entry;
            const currentElement = _elementProperties[id];
            if (!currentElement) return acc;
            // These are placed into maps to avoid duplicate writes to a specific value
            const styleUpdateMap = new Map<string, cd.IStyleDeclaration>();
            const inputUpdateMap = new Map<string, cd.PropertyModelInputs>();
            const symbolInstanceValueMap = new Map<string, cd.IActionStateChange[]>();
            const styleOverrideUpdateMap = new Map<string, cd.IKeyValue[]>();

            // Changes come in as partials for inputs and styles
            for (const change of props) {
              const { styles, baseStyles, inputs, instanceInputs, styleOverrides } =
                utils.changesFromModel(change);

              // Handle recording symbol instance values
              if (instanceInputs) {
                for (const [key, value] of Object.entries(instanceInputs)) {
                  const instanceActions = utils.buildInstanceChanges(id, key, value);
                  symbolInstanceValueMap.set(key, instanceActions);
                }
              }

              // Does this change include a style override? (Advance panel)
              if (styleOverrides) {
                for (const state of Object.keys(styles)) {
                  const overrides = utils.buildStyleOverrides(styles, state, currentElement);
                  styleOverrideUpdateMap.set(state, overrides);
                }
              }

              utils.addStateChangeToMap(baseStyles, styleUpdateMap); // Does this change include a style?
              utils.addStateChangeToMap(inputs, inputUpdateMap); // Does this change include an input?
            }

            const changeList: cd.IActionStateChange[] = [
              ...utils.flattenSymbolInstanceActionChangeMap(symbolInstanceValueMap),
              ...utils.buildChangeList(
                id,
                cd.ActionStateType.StyleOverride,
                styleOverrideUpdateMap
              ),
              ...utils.buildChangeList(id, cd.ActionStateType.Style, styleUpdateMap),
              ...utils.buildChangeList(id, cd.ActionStateType.Input, inputUpdateMap),
            ];

            acc = [...acc, ...changeList];
            return acc;
          }, []);

          this._recordSerivce.addStateChanges(stateChanges);
        })
      ),
    { dispatch: false }
  );
}
