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

import { Action } from '@ngrx/store';
import { ConfigAction } from '../../interfaces/action.interface';
import { PropertyPanelState } from 'cd-interfaces';

const PANELS = '[Panels]';

export const PANEL_RESIZE_LEFT = `${PANELS} Resize left panel`;
export const PANEL_SET_LEFT_VISIBILITY = `${PANELS} Set left panel visibility`;
export const PANEL_TOGGLE_LEFT_VISIBILITY = `${PANELS} Toggle left panel visibility`;

export const PANEL_RESIZE_RIGHT = `${PANELS} Resize right panel`;
export const PANEL_SET_RIGHT_VISIBILITY = `${PANELS} Set right panel visibility`;
export const PANEL_TOGGLE_COLLAPSE = `${PANELS} Toggle collapse`;

export const PANEL_RESIZE_BOTTOM = `${PANELS} Resize bottom panel`;
export const PANEL_SET_BOTTOM_VISIBILITY = `${PANELS} Set bottom panel visibility`;
export const PANEL_TOGGLE_BOTTOM_VISIBILITY = `${PANELS} Toggle bottom panel visibility`;

export const PANEL_SET_ACTIVITY = `${PANELS} Set activity`;
export const PANEL_SET_ACTIVITY_FORCED = `${PANELS} Set activity forced`;
export const PANEL_SET_ACTIVE_TAB_INDEX = `${PANELS} Set component panel active tab index`;
export const PANEL_SET_SEARCH_STRING = `${PANELS} Set search string`;

export const PANEL_SET_PROPERTIES_PANEL_STATE = `${PANELS} Set properties panel state`;

export const PANEL_START_RECORDING = `${PANELS} Start Recording`;
export const PANEL_STOP_RECORDING = `${PANELS} Stop Recording`;

export const PANEL_SET_PROPERTY_MODE = `${PANELS} Set property mode`;

export const PANEL_SHOW_SYMBOLS = `${PANELS} Show symbols`;
export const PANEL_ISOLATE_SYMBOL = `${PANELS} Isolate symbol`;
export const PANEL_EXIT_SYMBOL_MODE = `${PANELS} Exit symbol isolation`;
export const PANEL_SET_ISOLATION_MODE = `${PANELS} Set symbol isolation mode`;

export const PANEL_SET_KEYBOARD_SHORTCUTS_MODAL_VISIBILITY = `${PANELS} Set keyboard shortcut modal visibility`;
export const PANEL_TOGGLE_KEYBOARD_SHORTCUTS_MODAL = `${PANELS} Toggle keyboard shortcut modal visibility`;

class VisiblityPanel {
  constructor(public visible: boolean) {}
}

class SizePanel {
  constructor(public size: number) {}
}

// Mode for recording Interactions //////////////////////////////////////
export class PanelStartRecording implements Action {
  readonly type = PANEL_START_RECORDING;
  constructor(public elementId: string, public actionId?: string) {}
}

export class PanelStopRecording implements Action {
  readonly type = PANEL_STOP_RECORDING;
}
////////////////////////////////////////////////////////////////////////

export class PanelResizeLeft extends SizePanel implements Action {
  readonly type = PANEL_RESIZE_LEFT;
}

export class PanelSetLeftVisibility extends VisiblityPanel implements Action {
  readonly type = PANEL_SET_LEFT_VISIBILITY;
}

export class PanelToggleLeftVisibility implements Action {
  readonly type = PANEL_TOGGLE_LEFT_VISIBILITY;
}

export class PanelResizeRight extends SizePanel implements Action {
  readonly type = PANEL_RESIZE_RIGHT;
}

export class PanelSetRightVisibility extends VisiblityPanel implements Action {
  readonly type = PANEL_SET_RIGHT_VISIBILITY;
}

export class PanelToggleCollapse implements Action {
  readonly type = PANEL_TOGGLE_COLLAPSE;
}

export class PanelResizeBottom extends SizePanel implements Action {
  readonly type = PANEL_RESIZE_BOTTOM;
}

export class PanelSetBottomVisibility extends VisiblityPanel implements Action {
  readonly type = PANEL_SET_BOTTOM_VISIBILITY;
}

export class PanelToggleBottomVisibility implements Action {
  readonly type = PANEL_TOGGLE_BOTTOM_VISIBILITY;
}

export class PanelSetActivity extends ConfigAction {
  readonly type = PANEL_SET_ACTIVITY;
}

export class PanelSetActivityForced extends ConfigAction {
  readonly type = PANEL_SET_ACTIVITY_FORCED;
}

export class PanelSetPropertyMode extends ConfigAction {
  readonly type = PANEL_SET_PROPERTY_MODE;
}

export class PanelSetComponentPanelActiveTabIndex implements Action {
  readonly type = PANEL_SET_ACTIVE_TAB_INDEX;
  constructor(public index: number) {}
}

export class PanelSetPropertyPanelState implements Action {
  readonly type = PANEL_SET_PROPERTIES_PANEL_STATE;
  constructor(public state: PropertyPanelState) {}
}

export class PanelSetSearchString implements Action {
  readonly type = PANEL_SET_SEARCH_STRING;
  constructor(public search: string) {}
}

export class PanelShowSymbols extends ConfigAction {
  readonly type = PANEL_SHOW_SYMBOLS;
}

export class PanelIsolateSymbol extends ConfigAction {
  readonly type = PANEL_ISOLATE_SYMBOL;
}

export class PanelExitSymbolMode implements Action {
  readonly type = PANEL_EXIT_SYMBOL_MODE;
}

export class PanelSetIsolationMode implements Action {
  readonly type = PANEL_SET_ISOLATION_MODE;
  constructor(public symbolMode: boolean, public isolatedSymbolId?: string) {}
}

export class PanelToggleKeyboardShortcutModal implements Action {
  readonly type = PANEL_TOGGLE_KEYBOARD_SHORTCUTS_MODAL;
}

export class PanelSetKeyboardShortcutModalVisibility extends VisiblityPanel implements Action {
  readonly type = PANEL_SET_KEYBOARD_SHORTCUTS_MODAL_VISIBILITY;
}

export type PanelAction =
  | PanelExitSymbolMode
  | PanelIsolateSymbol
  | PanelResizeBottom
  | PanelResizeLeft
  | PanelResizeRight
  | PanelSetActivity
  | PanelSetActivityForced
  | PanelSetBottomVisibility
  | PanelSetComponentPanelActiveTabIndex
  | PanelSetIsolationMode
  | PanelSetKeyboardShortcutModalVisibility
  | PanelSetLeftVisibility
  | PanelSetPropertyMode
  | PanelSetPropertyPanelState
  | PanelSetRightVisibility
  | PanelSetSearchString
  | PanelShowSymbols
  | PanelStartRecording
  | PanelStopRecording
  | PanelToggleBottomVisibility
  | PanelToggleKeyboardShortcutModal
  | PanelToggleLeftVisibility
  | PanelToggleCollapse;
