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

import { IReducerFunctionLookup, PropertyPanelState } from 'cd-interfaces';
import * as PanelsActions from '../actions/panels.action';
import { initialPanel } from '../../configs/panel.config';
import { IPanelsState } from '../../interfaces/panel.interface';
import { IActivityConfig, PanelActivity } from '../../interfaces/activity.interface';
import { IPropertyModeConfig } from '../../interfaces/properties.interface';
import { deepCopy } from 'cd-utils/object';
import { PanelConfig } from '../../configs/project.config';
import { OPEN_ADD_DATASET_MENU } from '../actions/datasets.action';

const handleResizeLeftPanel = (
  state: IPanelsState,
  { size }: PanelsActions.PanelResizeLeft
): IPanelsState => ({
  ...state,
  leftPanel: { ...state.leftPanel, size },
});

const handleResizeBottomPanel = (
  state: IPanelsState,
  { size }: PanelsActions.PanelResizeBottom
): IPanelsState => ({
  ...state,
  bottomPanel: { ...state.bottomPanel, size },
});

const handleResizeRightPanel = (
  state: IPanelsState,
  { size }: PanelsActions.PanelResizeRight
): IPanelsState => ({
  ...state,
  rightPanel: { ...state.rightPanel, size },
});

const handleSetLeftPanelVisibility = (
  state: IPanelsState,
  { visible }: PanelsActions.PanelSetLeftVisibility
): IPanelsState => ({
  ...state,
  leftPanel: { ...state.leftPanel, visible },
});

const handleToggleLeftPanelVisibility = (
  state: IPanelsState,
  _action: PanelsActions.PanelToggleLeftVisibility
): IPanelsState => {
  return {
    ...state,
    leftPanel: {
      ...state.leftPanel,
      visible: !state.leftPanel.visible,
    },
  };
};

const handleSetRightPanelVisibility = (
  state: IPanelsState,
  { visible }: PanelsActions.PanelSetRightVisibility
): IPanelsState => ({
  ...state,
  rightPanel: { ...state.rightPanel, visible },
});

const handleTogglePanelCollapse = (
  state: IPanelsState,
  _action: PanelsActions.PanelToggleCollapse
): IPanelsState => {
  const visible = !state.rightPanel.visible;
  const rightPanel = { ...state.rightPanel, visible };
  const leftPanel = { ...state.leftPanel, visible };
  return { ...state, rightPanel, leftPanel };
};

const handlePropertiesPanelState = (
  state: IPanelsState,
  action: PanelsActions.PanelSetPropertyPanelState
): IPanelsState => {
  // Ignore any requests to change properties panel away from default state while recording
  const isRecording = state.recordStateChanges && action.state !== PropertyPanelState.Default;
  return isRecording ? state : { ...state, propertiesPanelState: action.state };
};

const handleSetBottomPanelVisibility = (
  state: IPanelsState,
  { visible }: PanelsActions.PanelSetBottomVisibility
): IPanelsState => ({
  ...state,
  bottomPanel: { ...state.bottomPanel, visible },
});

const handleToggleBottomPanelVisibility = (
  state: IPanelsState,
  _action: PanelsActions.PanelToggleBottomVisibility
): IPanelsState => ({
  ...state,
  bottomPanel: { ...state.bottomPanel, visible: !state.bottomPanel.visible },
});

const handleSetActivity = (
  state: IPanelsState,
  { config }: PanelsActions.PanelSetActivity
): IPanelsState => {
  const updatedState = deepCopy(state);
  const activityConfig = config as IActivityConfig;
  if (activityConfig.id === PanelActivity.Code) {
    updatedState.bottomPanel.visible = !state.bottomPanel.visible;
  } else {
    if (activityConfig.id === state.currentActivity.id) {
      updatedState.leftPanel.visible = !state.leftPanel.visible;
    } else {
      updatedState.leftPanel.visible = true;
      updatedState.currentActivity = activityConfig;
    }
  }
  return updatedState;
};

const handleSetActivityForced = (
  state: IPanelsState,
  { config }: PanelsActions.PanelSetActivity
): IPanelsState => {
  const updatedState = deepCopy(state);
  const activityConfig = config as IActivityConfig;
  if (activityConfig.id === PanelActivity.Code) {
    updatedState.bottomPanel.visible = !state.bottomPanel.visible;
  } else {
    updatedState.leftPanel.visible = true;
    updatedState.currentActivity = activityConfig;
  }
  return updatedState;
};

const handleOpenAddDatasetMenu = (state: IPanelsState): IPanelsState => {
  const openDataPanelAction = new PanelsActions.PanelSetActivityForced(PanelConfig.Data, {});
  return handleSetActivityForced(state, openDataPanelAction);
};

const handleSetPropertyMode = (
  state: IPanelsState,
  { config }: PanelsActions.PanelSetPropertyMode
): IPanelsState => {
  const propertyMode = config as IPropertyModeConfig;
  const updatedState = { ...state, propertyMode };
  return updatedState;
};

const handlePanelSetComponentPanelActiveTabIndex = (
  state: IPanelsState,
  action: PanelsActions.PanelSetComponentPanelActiveTabIndex
): IPanelsState => ({
  ...state,
  componentPanelActiveTabIndex: action.index,
});

const handlePanelSetSearchString = (
  state: IPanelsState,
  action: PanelsActions.PanelSetSearchString
): IPanelsState => ({
  ...state,
  searchString: action.search,
});

const handleSetIsolationMode = (
  state: IPanelsState,
  { symbolMode, isolatedSymbolId }: PanelsActions.PanelSetIsolationMode
): IPanelsState => ({
  ...state,
  symbolMode,
  isolatedSymbolId,
});

const handleToggleKeyboardShortcutsModal = (
  state: IPanelsState,
  _action: PanelsActions.PanelToggleKeyboardShortcutModal
): IPanelsState => ({
  ...state,
  keyboardShortcutsModalOpen: !state.keyboardShortcutsModalOpen,
});

const handleSetKeyboardShortcutsModalVisibility = (
  state: IPanelsState,
  { visible }: PanelsActions.PanelSetKeyboardShortcutModalVisibility
): IPanelsState => ({
  ...state,
  keyboardShortcutsModalOpen: visible,
});

const handleStartRecording = (state: IPanelsState): IPanelsState => ({
  ...state,
  recordStateChanges: true,
});

const handleStopRecording = (state: IPanelsState): IPanelsState => ({
  ...state,
  recordStateChanges: false,
});

const lookup: IReducerFunctionLookup = {
  [PanelsActions.PANEL_RESIZE_BOTTOM]: handleResizeBottomPanel,
  [PanelsActions.PANEL_RESIZE_LEFT]: handleResizeLeftPanel,
  [PanelsActions.PANEL_RESIZE_RIGHT]: handleResizeRightPanel,
  [PanelsActions.PANEL_SET_ACTIVE_TAB_INDEX]: handlePanelSetComponentPanelActiveTabIndex,
  [PanelsActions.PANEL_SET_ACTIVITY]: handleSetActivity,
  [PanelsActions.PANEL_SET_ACTIVITY_FORCED]: handleSetActivityForced,
  [PanelsActions.PANEL_SET_BOTTOM_VISIBILITY]: handleSetBottomPanelVisibility,
  [PanelsActions.PANEL_SET_LEFT_VISIBILITY]: handleSetLeftPanelVisibility,
  [PanelsActions.PANEL_SET_PROPERTY_MODE]: handleSetPropertyMode,
  [PanelsActions.PANEL_SET_RIGHT_VISIBILITY]: handleSetRightPanelVisibility,
  [PanelsActions.PANEL_SET_SEARCH_STRING]: handlePanelSetSearchString,
  [PanelsActions.PANEL_TOGGLE_BOTTOM_VISIBILITY]: handleToggleBottomPanelVisibility,
  [PanelsActions.PANEL_TOGGLE_LEFT_VISIBILITY]: handleToggleLeftPanelVisibility,
  [PanelsActions.PANEL_TOGGLE_COLLAPSE]: handleTogglePanelCollapse,
  [PanelsActions.PANEL_SET_ISOLATION_MODE]: handleSetIsolationMode,
  [PanelsActions.PANEL_TOGGLE_KEYBOARD_SHORTCUTS_MODAL]: handleToggleKeyboardShortcutsModal,
  [PanelsActions.PANEL_SET_KEYBOARD_SHORTCUTS_MODAL_VISIBILITY]:
    handleSetKeyboardShortcutsModalVisibility,
  [PanelsActions.PANEL_SET_PROPERTIES_PANEL_STATE]: handlePropertiesPanelState,
  [PanelsActions.PANEL_START_RECORDING]: handleStartRecording,
  [PanelsActions.PANEL_STOP_RECORDING]: handleStopRecording,
  [OPEN_ADD_DATASET_MENU]: handleOpenAddDatasetMenu,
};

export function reducer(state = initialPanel, action: PanelsActions.PanelAction) {
  return action.type in lookup ? lookup[action.type]?.(state, action) : state;
}
