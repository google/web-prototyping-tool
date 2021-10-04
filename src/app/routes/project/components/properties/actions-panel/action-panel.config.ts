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
import * as cd from 'cd-interfaces';
import { InteractionConfig } from 'src/app/routes/project/configs/project.config';

export const ACTION_DOCS_URL = '';

export interface IQuickInteraction extends cd.IConfig {
  desc: string;
  maxHeight?: number;
}

const DEFAULT_BACKDROP_COLOR = 'rgba(0,0,0,0.32)';

// TODO These values should bind to the design system
export const MaterialElevation = {
  Level1: '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15)',
  Level2: '0 1px 2px 0 rgba(60,64,67,0.30), 0 2px 6px 2px rgba(60,64,67,0.15)',
  Level3: '0 1px 3px 0 rgba(60,64,67,0.30), 0 4px 8px 3px rgba(60,64,67,0.15)',
  Level4: '0 2px 3px 0 rgba(60,64,67,0.30), 0 6px 10px 4px rgba(60,64,67,0.15)',
  Level5: '0 4px 4px 0 rgba(60,64,67,0.30), 0 8px 12px 6px rgba(60,64,67,0.15)',
} as const;

export const ELEVATION_MENU_CONFIG: cd.ISelectItem[] = [
  { title: 'Level 1', value: MaterialElevation.Level1 },
  { title: 'Level 2', value: MaterialElevation.Level2 },
  { title: 'Level 3', value: MaterialElevation.Level3 },
  { title: 'Level 4', value: MaterialElevation.Level4 },
  { title: 'Level 5', value: MaterialElevation.Level5 },
];

const OVERLAY_SIZE_BOARD = { title: 'Match target', value: cd.OverlaySize.Board };
const OVERLAY_SIZE_CONTENT = { title: 'Content size', value: cd.OverlaySize.Content };
const OVERLAY_SIZE_CUSTOM = { title: 'Custom', value: cd.OverlaySize.Custom };

export const OVERLAY_SIZE_MENU: cd.ISelectItem[] = [OVERLAY_SIZE_BOARD, OVERLAY_SIZE_CUSTOM];

export const MODAL_SIZE_MENU: cd.ISelectItem[] = [
  OVERLAY_SIZE_BOARD,
  OVERLAY_SIZE_CONTENT,
  OVERLAY_SIZE_CUSTOM,
];

enum AlignTooltip {
  Left = 'Left',
  Center = 'Center',
  Right = 'Right',
  Top = 'Top',
  Bottom = 'Bottom',
}

export interface IOverlayAlignToggle {
  value: cd.ActionOverlayPosition;
  tooltip: AlignTooltip;
  icon: string;
}

export const OVERLAY_HORIZONTAL: cd.ISelectItem[] = [
  {
    title: 'Left',
    value: cd.ActionOverlayPosition.Left,
  },
  {
    title: 'Center',
    value: cd.ActionOverlayPosition.Center,
  },
  {
    title: 'Right',
    value: cd.ActionOverlayPosition.Right,
  },
];

export const OVERLAY_VERTICAL: cd.ISelectItem[] = [
  {
    title: 'Top',
    value: cd.ActionOverlayPosition.Top,
  },
  {
    title: 'Center',
    value: cd.ActionOverlayPosition.Center,
  },
  {
    title: 'Bottom',
    value: cd.ActionOverlayPosition.Bottom,
  },
];

export const POSITON_MENU_CONFIG: cd.ISelectItem[] = [
  { title: 'Above', value: cd.ActionOverlayPosition.Top },
  { title: 'Left', value: cd.ActionOverlayPosition.Left },
  { title: 'Center', value: cd.ActionOverlayPosition.Center },
  { title: 'Right', value: cd.ActionOverlayPosition.Right },
  { title: 'Below', value: cd.ActionOverlayPosition.Bottom },
];

export const QUICK_INTERACTIONS: ReadonlyArray<IQuickInteraction> = [
  {
    ...InteractionConfig.NavigateToBoard,
    title: 'Navigate',
    desc: 'Navigate to another board on an event trigger.',
  },
  {
    ...InteractionConfig.PresentModal,
    title: 'Present Modal',
    desc: 'Show a modal with the contents of a board.',
  },
  {
    ...InteractionConfig.RecordState,
    title: 'Record State',
    desc: 'Record input changes and apply animations.',
  },
  {
    ...InteractionConfig.OpenDrawer,
    title: 'Drawer / Subtask',
    desc: 'Open a drawer with the contents of a board.',
    maxHeight: 600,
  },
  {
    ...InteractionConfig.Snackbar,
    title: 'Snackbar',
    desc: 'Display a notification',
    maxHeight: 600,
  },
];

const BOARD_PORTAL_KEY = 'referenceId';

const DEFAULT_ACTION_BEHAVIOR: Partial<cd.ActionBehavior> = {
  target: '',
};

const DEFAULT_SWAP_PORTAL: Partial<cd.IActionBehaviorSwapPortal> = {
  stateChanges: [
    { elementId: '', type: cd.ActionStateType.Input, key: BOARD_PORTAL_KEY, value: '' },
  ],
};

const DEFAULT_PRESENT_MODAL: Partial<cd.IActionBehaviorPresentModal> = {
  backgroundColor: { value: DEFAULT_BACKDROP_COLOR },
  shadow: MaterialElevation.Level4,
  borderRadius: 8,
  size: cd.OverlaySize.Board,
  target: '',
};

const DEFAULT_PRESENT_OVERLAY: Partial<cd.IActionBehaviorPresentOverlay> = {
  borderRadius: 0,
  position: cd.ActionOverlayPosition.Bottom,
  alignment: cd.ActionOverlayPosition.Center,
  closeOnOutsideClick: true,
  size: cd.OverlaySize.Board,
  spacing: 8,
  target: '',
};

const DEFAULT_RECORD_STATE: Partial<cd.IActionBehaviorRecordState> = {
  stateChanges: [] as cd.IActionStateChange[],
};

const DEFAULT_SNACKBAR: Partial<cd.IActionBehaviorSnackbar> = {
  message: 'Hello Google!',
  duration: 5000,
  verticalPosition: cd.SnackBarVerticalPosition.Bottom,
  horizontalPosition: cd.SnackBarHorizontalPosition.Center,
};

const DEFAULT_POST_MESSAGE: Partial<cd.IActionBehaviorPostMessage> = {
  target: '',
};

const DEFAULT_JS_EVENT: Partial<cd.IActionBehaviorRunJS> = {
  target: '',
  value: '',
};

const DEFAULT_OPEN_DRAWER: Partial<cd.IActionBehaviorOpenDrawer> = {
  backdropColor: { value: DEFAULT_BACKDROP_COLOR },
  position: cd.ActionDrawerPosition.Right,
  mode: cd.ActionDrawerMode.Overlay,
  size: 300,
  target: '',
};

const DEFAULT_RESET_EVENT: Partial<cd.IActionBehaviorResetState> = {
  mode: cd.ActionResetMode.CurrentBoard,
};

const DEFAULT_SCROLL_EVENT: Partial<cd.IActionBehaviorScrollTo> = {
  mode: cd.ActionScrollMode.Top,
  animate: true,
  block: cd.ActionScrollAlign.Start,
  inline: cd.ActionScrollAlign.Nearest,
};

export const DEFAULT_PER_INTERACTION_TYPE: cd.ReadonlyRecord<
  cd.ActionType,
  Partial<cd.ActionBehavior>
> = {
  [cd.ActionType.NavigateToBoard]: DEFAULT_ACTION_BEHAVIOR,
  [cd.ActionType.NavigateToUrl]: DEFAULT_ACTION_BEHAVIOR,
  [cd.ActionType.SwapPortal]: DEFAULT_SWAP_PORTAL,
  [cd.ActionType.PresentOverlay]: DEFAULT_PRESENT_OVERLAY,
  [cd.ActionType.CloseOverlay]: DEFAULT_ACTION_BEHAVIOR,
  [cd.ActionType.PresentModal]: DEFAULT_PRESENT_MODAL,
  [cd.ActionType.ExitModal]: DEFAULT_ACTION_BEHAVIOR,
  [cd.ActionType.OpenDrawer]: DEFAULT_OPEN_DRAWER,
  [cd.ActionType.CloseDrawer]: DEFAULT_ACTION_BEHAVIOR,
  [cd.ActionType.RecordState]: DEFAULT_RECORD_STATE,
  [cd.ActionType.Snackbar]: DEFAULT_SNACKBAR,
  [cd.ActionType.PostMessage]: DEFAULT_POST_MESSAGE,
  [cd.ActionType.RunJS]: DEFAULT_JS_EVENT,
  [cd.ActionType.ResetState]: DEFAULT_RESET_EVENT,
  [cd.ActionType.ScrollTo]: DEFAULT_SCROLL_EVENT,
};

const MOUSE_ICON = 'mouse';

export const INTERACTION_TRIGGER_MENU: cd.ISelectItem[] = [
  { title: 'Click', value: cd.EventTrigger.Click, icon: MOUSE_ICON },
  { title: 'Hover', value: cd.EventTrigger.Hover, icon: MOUSE_ICON },
  { title: 'Double Click', value: cd.EventTrigger.DoubleClick, icon: MOUSE_ICON },
  { title: 'Mouse Enter', value: cd.EventTrigger.MouseEnter, icon: MOUSE_ICON },
  { title: 'Mouse Leave', value: cd.EventTrigger.MouseLeave, icon: MOUSE_ICON },
  { title: 'Mouse Down', value: cd.EventTrigger.MouseDown, icon: MOUSE_ICON },
  { title: 'Mouse Up', value: cd.EventTrigger.MouseUp, icon: MOUSE_ICON, divider: true },
  {
    title: 'Board Appears',
    value: cd.EventTrigger.BoardAppear,
    icon: InteractionConfig.NavigateToBoard.icon,
  },
];

export const INTERACTION_TYPE_MENU: cd.ISelectItem[] & cd.IMenuConfig[] = [
  {
    title: InteractionConfig.NavigateToBoard.title,
    icon: InteractionConfig.NavigateToBoard.icon,
    value: cd.ActionType.NavigateToBoard,
  },
  {
    title: InteractionConfig.NavigateToUrl.title,
    icon: InteractionConfig.NavigateToUrl.icon,
    value: cd.ActionType.NavigateToUrl,
    divider: true,
  },
  {
    title: InteractionConfig.RecordState.title,
    icon: InteractionConfig.RecordState.icon,
    value: cd.ActionType.RecordState,
  },
  {
    title: InteractionConfig.ResetState.title,
    icon: InteractionConfig.ResetState.icon,
    value: cd.ActionType.ResetState,
    divider: true,
  },
  {
    title: InteractionConfig.PresentModal.title,
    icon: InteractionConfig.PresentModal.icon,
    value: cd.ActionType.PresentModal,
  },
  {
    title: InteractionConfig.ExitModal.title,
    icon: InteractionConfig.ExitModal.icon,
    value: cd.ActionType.ExitModal,
    divider: true,
  },
  {
    title: InteractionConfig.PresentOverlay.title,
    icon: InteractionConfig.PresentOverlay.icon,
    value: cd.ActionType.PresentOverlay,
  },
  {
    title: InteractionConfig.CloseOverlay.title,
    icon: InteractionConfig.CloseOverlay.icon,
    value: cd.ActionType.CloseOverlay,
    divider: true,
  },
  {
    title: InteractionConfig.OpenDrawer.title,
    icon: InteractionConfig.OpenDrawer.icon,
    value: cd.ActionType.OpenDrawer,
  },
  {
    title: InteractionConfig.CloseDrawer.title,
    icon: InteractionConfig.CloseDrawer.icon,
    value: cd.ActionType.CloseDrawer,
    divider: true,
  },
  {
    title: InteractionConfig.ScrollTo.title,
    icon: InteractionConfig.ScrollTo.icon,
    value: cd.ActionType.ScrollTo,
  },
  {
    title: InteractionConfig.SwapPortal.title,
    icon: InteractionConfig.SwapPortal.icon,
    value: cd.ActionType.SwapPortal,
  },
  {
    title: InteractionConfig.Snackbar.title,
    icon: InteractionConfig.Snackbar.icon,
    value: cd.ActionType.Snackbar,
    divider: true,
  },
  {
    title: InteractionConfig.PostMessage.title,
    icon: InteractionConfig.PostMessage.icon,
    value: cd.ActionType.PostMessage,
  },
  {
    title: InteractionConfig.RunJS.title,
    icon: InteractionConfig.RunJS.icon,
    value: cd.ActionType.RunJS,
  },
];

export const OUTPUT_BINDING_BOOL: cd.ISelectItem[] = [
  { title: 'True', value: String(true) },
  { title: 'False', value: String(false) },
];

export const DELAY_AUTOCOMPLETE_MENU: cd.ISelectItem[] = [
  { title: '150 ms', value: '150' },
  { title: '250 ms', value: '250' },
  { title: '500 ms', value: '500' },
  { title: '1.0 sec', value: '1000' },
  { title: '1.5 sec', value: '1500' },
  { title: '2.0 sec', value: '2000' },
];

export const SNACKBAR_VERTICAL_POSITON_MENU: cd.ISelectItem[] = [
  { title: 'Top', value: cd.SnackBarVerticalPosition.Top },
  { title: 'Bottom', value: cd.SnackBarVerticalPosition.Bottom },
];

export const SNACKBAR_HORIZONTAL_POSITON_MENU: cd.ISelectItem[] = [
  { title: 'Left', value: cd.SnackBarHorizontalPosition.Left },
  { title: 'Center', value: cd.SnackBarHorizontalPosition.Center },
  { title: 'Right', value: cd.SnackBarHorizontalPosition.Right },
];

export const RICH_TOOLTIPS: cd.IStringMap<cd.IRichTooltip> = {
  SnackBarButton: {
    text: 'Adding a label will make a button appear inside the snackbar.',
  },
  PortalSelect: {
    text: 'Portals are elements that project the contents of a board.',
  },
};

export const RUNJS_SCRIPT_PLACEHOLDER = 'Accepts valid JavaScript...';

export const POSTMESSAGE_PLACEHOLDER = 'Accepts valid JSON...\ni.e { "foo": "bar" }';

export const RESET_MENU_OPTIONS: cd.ISelectItem[] = [
  {
    title: 'All',
    value: cd.ActionResetMode.All,
  },
  {
    title: 'Current board',
    value: cd.ActionResetMode.CurrentBoard,
  },
  {
    title: 'Element',
    value: cd.ActionResetMode.Element,
  },
];

export const CODE_INPUT_JSON_CONTEXT = {
  label: 'JSON',
  validMsg: 'Valid JSON',
  invalidMsg: 'Invalid JSON will not be saved',
};

export const CODE_INPUT_JS_CONTEXT = {
  label: 'Script',
  validMsg: 'Saved but may not catch runtime errors',
  invalidMsg: 'Invalid code will not be saved',
};

export const SCROLL_ALIGN_MENU: cd.ISelectItem[] = [
  {
    title: 'Start',
    value: cd.ActionScrollAlign.Start,
  },
  {
    title: 'Center',
    value: cd.ActionScrollAlign.Center,
  },
  {
    title: 'End',
    value: cd.ActionScrollAlign.End,
  },
  {
    title: 'Nearest',
    value: cd.ActionScrollAlign.Nearest,
  },
];

export const SCROLL_MENU_OPTIONS: cd.ISelectItem[] = [
  {
    title: 'Element',
    value: cd.ActionScrollMode.Element,
    divider: true,
  },
  {
    title: 'Top',
    value: cd.ActionScrollMode.Top,
  },
  {
    title: 'Bottom',
    value: cd.ActionScrollMode.Bottom,
    divider: true,
  },
  {
    title: 'Left',
    value: cd.ActionScrollMode.Left,
  },
  {
    title: 'Right',
    value: cd.ActionScrollMode.Right,
  },
];

export const OUTPUT_CONDITIONS_MENU: cd.ISelectItem[] = [
  {
    title: 'None',
    icon: '/assets/icons/conditions/none.svg',
    value: cd.OutputCondition.None,
    subtitle: 'Any input calls the action',
  },
  {
    title: 'Equals',
    icon: '/assets/icons/conditions/equals.svg',
    value: cd.OutputCondition.Equals,
  },
  {
    title: 'Not Equal to',
    value: cd.OutputCondition.NotEquals,
    icon: '/assets/icons/conditions/not-equal.svg',
  },
  {
    title: 'Includes',
    value: cd.OutputCondition.Includes,
    subtitle: 'String includes value',
    icon: '/assets/icons/conditions/includes.svg',
  },
  {
    title: 'Does not Include',
    icon: '/assets/icons/conditions/excludes.svg',
    value: cd.OutputCondition.NotIncludes,
    subtitle: 'String does not include value',
    divider: true,
  },
  {
    icon: '/assets/icons/conditions/greaterthan.svg',
    title: 'Greater than',
    value: cd.OutputCondition.GreaterThan,
    subtitle: 'Number greater than value',
  },
  {
    icon: '/assets/icons/conditions/greaterthan-equal.svg',
    title: 'Greater than or equal to',
    value: cd.OutputCondition.GreaterThanOrEqualTo,
    subtitle: 'Number greater than or equal to value',
  },
  {
    icon: '/assets/icons/conditions/lessthan.svg',
    title: 'Less than',
    value: cd.OutputCondition.LessThan,
    subtitle: 'Number less than value',
  },
  {
    icon: '/assets/icons/conditions/lessthan-equal.svg',
    title: 'Less than or equal to',
    value: cd.OutputCondition.LessThanOrEqualTo,
    subtitle: 'Number less than or equal to value',
  },
];
