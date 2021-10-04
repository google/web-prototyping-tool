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

import { KEYS, Modifier, parseShortcut } from 'cd-utils/keycodes';
import { IActivityConfig, PanelActivity } from '../interfaces/activity.interface';
import { IPropertyModeConfig } from '../interfaces/properties.interface';
import { LayerIcons, SYMBOL_USER_FACING_NAME_LC } from 'cd-common/consts';
import * as appAction from 'src/app/store/actions';
import * as action from '../store/actions';
import * as propertiesActions from '../store/actions/element-properties.action';
import * as designSystemActions from '../store/actions/design-system.action';
import * as assetsActions from '../store/actions/assets.action';
import * as cd from 'cd-interfaces';

export type IConfigRecord = cd.ReadonlyRecord<string, cd.IConfig>;
export type IActivityRecord = cd.ReadonlyRecord<string, IActivityConfig>;
type IPropertyModeRecord = cd.ReadonlyRecord<string, IPropertyModeConfig>;

const keyAndShiftKey = (key: string): [string, string] => [key, `${Modifier.Shift} ${key}`];

export const BOARD_PORTAL_MENU_ITEM_ID = 'boardPortalMenuItem';
export const GROUP_INTO_MENU_ITEM_ID = 'groupInto';
export const ADD_ACTION_MENU_ITEM_ID = 'addAction';
export const TOGGLE_VISIBILITY_MENU_ITEM_ID = 'toggleVisibilty';

export enum VisibilityIcon {
  Shown = 'visibility',
  Hidden = 'visibility_off',
}

export enum VisibilityMenuItemTitle {
  Show = 'Show layers',
  Hide = 'Hide layers',
}

export const layoutConfig: IConfigRecord = {
  ConvertToLayout: {
    title: 'Copy Layout',
    icon: '/assets/icons/layout-preset.svg',
    action: action.LAYOUT_CONVERT_SELECTION,
  },
};

export const GroupConfig: IConfigRecord = {
  VerticalGroup: {
    title: 'Vertical Stack',
    icon: '/assets/icons/vert-stack-group.svg',
    action: action.ELEMENT_PROPS_GROUP_ELEMENTS,
    additionalParams: { layout: cd.LayoutMode.Rows },
  },
  HorizontalGroup: {
    title: 'Horizontal Stack',
    icon: '/assets/icons/horz-stack-group.svg',
    action: action.ELEMENT_PROPS_GROUP_ELEMENTS,
    additionalParams: { layout: cd.LayoutMode.Cols },
  },
  GridGroup: {
    title: 'Grid',
    icon: '/assets/icons/grid-group.svg',
    action: action.ELEMENT_PROPS_GROUP_ELEMENTS,
    additionalParams: { layout: cd.LayoutMode.Grid },
  },
};

export const EditConfig: IConfigRecord = {
  Cut: {
    title: 'Cut',
    shortcut: 'control x',
    icon: 'content_cut',
    action: action.CLIPBOARD_CUT,
  },
  Copy: {
    title: 'Copy',
    shortcut: `control c`,
    icon: 'content_copy',
    passive: true,
    action: action.CLIPBOARD_COPY,
    e2eLabel: 'copy',
  },
  CopyJSON: {
    title: 'Copy JSON',
    icon: '/assets/icons/json-ico.svg',
    action: action.CLIPBOARD_COPY_JSON,
    e2eLabel: 'copy-json',
  },
  CopyHtml: {
    title: 'Copy HTML & CSS',
    icon: 'code',
    action: action.CLIPBOARD_COPY_HTML,
    e2eLabel: 'copy-html',
  },
  CopyCss: {
    title: 'Copy CSS',
    icon: 'palette',
    action: action.CLIPBOARD_COPY_CSS,
    e2eLabel: 'copy-css',
  },
  Paste: {
    title: 'Paste',
    shortcut: `control v`,
    icon: 'content_paste',
    passive: true,
    action: action.CLIPBOARD_PASTE,
    e2eLabel: 'paste',
  },
  Group: {
    title: 'Group',
    shortcut: `control g`,
    icon: '/assets/icons/group.svg',
    action: action.ELEMENT_PROPS_GROUP_ELEMENTS,
    e2eLabel: 'group',
  },
  Ungroup: {
    title: 'Ungroup',
    shortcut: `control shift g`,
    icon: '/assets/icons/un-group.svg',
    action: action.ELEMENT_PROPS_UNGROUP_ELEMENTS,
  },
  GroupInto: {
    id: GROUP_INTO_MENU_ITEM_ID,
    title: 'Group Into...',
  },
  CreateSymbol: {
    title: 'Create component',
    action: action.SYMBOL_CREATE,
    icon: LayerIcons.Component,
    e2eLabel: 'create-symbol',
  },
  EditSymbol: {
    title: 'Edit component',
    action: action.PANEL_ISOLATE_SYMBOL,
    icon: 'edit',
    e2eLabel: 'edit-symbol',
  },
  UnpackSymbolInstance: {
    title: 'Detach from component',
    icon: '/assets/icons/detach-component.svg',
    action: action.SYMBOL_UNPACK_INSTANCE,
    e2eLabel: 'unpack-symbol',
  },
  Duplicate: {
    title: 'Duplicate',
    shortcut: `control d`,
    action: action.ELEMENT_PROPS_DUPLICATE,
    e2eLabel: 'duplicate',
  },
  Undo: {
    title: 'Undo',
    shortcut: `control z`,
    icon: 'undo',
    action: action.HISTORY_UNDO,
    e2eLabel: 'undo',
  },
  Redo: {
    title: 'Redo',
    shortcut: `control shift z`,
    icon: 'redo',
    action: action.HISTORY_REDO,
    e2eLabel: 'redo',
  },
  InsertBoardPortal: {
    id: BOARD_PORTAL_MENU_ITEM_ID,
    title: 'Insert Board Portal',
    icon: '/assets/icons/board-portal.svg',
  },
  Visibility: {
    id: TOGGLE_VISIBILITY_MENU_ITEM_ID,
    title: VisibilityMenuItemTitle.Show,
    icon: VisibilityIcon.Shown,
    shortcut: 'control shift h',
    action: action.ELEMENT_PROPS_TOGGLE_VISIBILITY,
  },
  Delete: {
    title: 'Delete',
    icon: 'delete',
    shortcut: [KEYS.Delete, KEYS.Backspace],
    action: action.ELEMENT_PROPS_DELETE_ELEMENTS_AND_CHILDERN,
    e2eLabel: 'delete',
  },
  EditCodeComponent: {
    title: 'Edit code component',
    action: action.CODE_COMPONENT_OPEN_EDITOR,
    icon: 'edit',
    e2eLabel: 'edit-code-component',
  },
};

export const ZoomConfig: IConfigRecord = {
  ZoomIn: {
    title: 'Zoom In',
    icon: 'zoom_in',
    shortcut: [`control +`, `control =`, KEYS.Plus, KEYS.Equals],
    action: action.CANVAS_ZOOM_IN,
  },
  ZoomOut: {
    title: 'Zoom Out',
    icon: 'zoom_out',
    shortcut: [`control -`, KEYS.Minus],
    action: action.CANVAS_ZOOM_OUT,
  },
  Reset: {
    title: 'Reset Zoom',
    icon: 'settings_overscan',
    shortcut: '0',
    action: action.CANVAS_ZOOM_RESET,
  },
  FitToBounds: {
    title: 'Fit content',
    shortcut: '1',
    icon: 'settings_overscan',
    action: action.CANVAS_FIT_TO_BOUNDS,
  },
};

export const ElementMoveConfig: IConfigRecord = {
  OrderChange: {
    title: 'Order Change',
    shortcut: ['control ]', 'control ['],
    action: action.ELEMENT_PROPS_ORDER_CHANGE,
  },
  Move: {
    title: 'Move',
    shortcut: [
      ...keyAndShiftKey(KEYS.ArrowLeft),
      ...keyAndShiftKey(KEYS.ArrowUp),
      ...keyAndShiftKey(KEYS.ArrowRight),
      ...keyAndShiftKey(KEYS.ArrowDown),
    ],
    action: action.ELEMENT_PROPS_MOVE,
  },
  SelectParent: {
    title: 'Select parent element',
    shortcut: [KEYS.Escape],
    action: action.ELEMENT_PROPS_SELECT_PARENT,
  },
};

const DefaultOutletFrameConfig: IConfigRecord = {
  MoveLeft: {
    title: 'Nudge Left',
    shortcut: keyAndShiftKey(KEYS.ArrowLeft),
    action: action.BOARD_MOVE,
  },
  MoveRight: {
    title: 'Nudge Right',
    shortcut: keyAndShiftKey(KEYS.ArrowRight),
    action: action.BOARD_MOVE,
  },
  MoveUp: {
    title: 'Nudge Up',
    shortcut: keyAndShiftKey(KEYS.ArrowUp),
    action: action.BOARD_MOVE,
  },
  MoveDown: {
    title: 'Nudge Down',
    shortcut: keyAndShiftKey(KEYS.ArrowDown),
    action: action.BOARD_MOVE,
  },
};

export const BoardConfig: IConfigRecord = {
  ...DefaultOutletFrameConfig,
  SnapTo: {
    title: 'Snap to Board',
    icon: 'crop_free',
    shortcut: '2',
    action: action.CANVAS_SNAP_TO_BOARD,
  },
  Add: {
    title: 'Add Board',
    icon: 'slides_add_on',
    action: action.BOARD_CREATE,
  },
  Preview: {
    title: 'Preview Board',
    icon: 'play_arrow',
    shortcut: 'control Enter',
    action: action.BOARD_PREVIEW,
    e2eLabel: 'preview-board',
  },
  AssignHome: {
    icon: LayerIcons.Home,
    title: 'Assign as Home',
    action: action.BOARD_SET_HOME,
  },
};

export const SymbolConfig: IConfigRecord = {
  ...DefaultOutletFrameConfig,
  SnapTo: {
    title: `Snap to ${SYMBOL_USER_FACING_NAME_LC}`,
    icon: 'crop_free',
    shortcut: '2',
    action: action.CANVAS_SNAP_TO_BOARD,
  },
  Preview: {
    ...BoardConfig.Preview,
    title: `Preview ${SYMBOL_USER_FACING_NAME_LC}`,
  },
};

export const CanvasConfig: IConfigRecord = {
  PanLeft: {
    title: 'Pan Left',
    shortcut: keyAndShiftKey(KEYS.ArrowLeft),
    action: action.CANVAS_PAN,
  },
  PanRight: {
    title: 'Pan Right',
    shortcut: keyAndShiftKey(KEYS.ArrowRight),
    action: action.CANVAS_PAN,
  },
  PanUp: {
    title: 'Pan Up',
    shortcut: keyAndShiftKey(KEYS.ArrowUp),
    action: action.CANVAS_PAN,
  },
  PanDown: {
    title: 'Pan Down',
    shortcut: keyAndShiftKey(KEYS.ArrowDown),
    action: action.CANVAS_PAN,
  },
};

export const ProjectConfig: IConfigRecord = {
  Run: {
    title: 'Preview',
    icon: 'play_arrow',
    shortcut: 'control Enter',
    action: appAction.APP_GO_TO_PREVIEW,
  },
  TogglePanelCollapse: {
    title: 'Collapse Panels',
    shortcut: `control .`,
    action: action.PANEL_TOGGLE_COLLAPSE,
  },
  ToggleKeyboardShortcutsModal: {
    title: 'Shortcuts',
    icon: 'keyboard',
    shortcut: 'control /',
    action: action.PANEL_TOGGLE_KEYBOARD_SHORTCUTS_MODAL,
  },
  ToggleGlassBreak: {
    title: 'Toggle break glass',
    shortcut: `control shift /`,
    action: appAction.SETTINGS_BREAK_GLASS_TOGGLE,
  },
};

export const PREVIEW_TOGGLE_SHORTCUT: string = parseShortcut(ProjectConfig.Run.shortcut as string);

export const PanelConfig: IActivityRecord = {
  Components: {
    id: PanelActivity.Components,
    title: 'Components',
    icon: 'add',
    shortcut: 'c',
    action: action.PANEL_SET_ACTIVITY,
    headerAction: {
      title: 'Add',
    },
  },
  Layers: {
    id: PanelActivity.Layers,
    title: 'Layers',
    icon: 'layers',
    shortcut: 'l',
    action: action.PANEL_SET_ACTIVITY,
  },
  Theme: {
    id: PanelActivity.Theme,
    title: 'Theme',
    icon: 'styles',
    shortcut: 't',
    action: action.PANEL_SET_ACTIVITY,
  },
  Data: {
    id: PanelActivity.Data,
    title: 'Data',
    icon: 'insert_chart_outlined',
    shortcut: 'd',
    action: action.PANEL_SET_ACTIVITY,
    headerAction: {
      title: 'Add',
    },
  },
  Assets: {
    id: PanelActivity.Assets,
    title: 'Assets',
    icon: 'photo',
    shortcut: 'g',
    action: action.PANEL_SET_ACTIVITY,
    headerAction: {
      title: 'Add',
      action: action.ASSETS_SELECT_FILES,
    },
  },
  About: {
    id: PanelActivity.About,
    title: 'About',
    icon: 'help_outline',
    action: action.PANEL_SET_ACTIVITY,
  },
  Feedback: {
    id: PanelActivity.Feedback,
    title: 'Report an issue',
    icon: 'feedback',
    action: appAction.SEND_FEEDBACK,
  },
  Settings: {
    id: PanelActivity.Settings,
    title: 'Settings',
    icon: 'settings',
    action: action.PANEL_SET_ACTIVITY,
  },
};

export const PropertyConfig: IPropertyModeRecord = {
  Default: {
    id: cd.PropertyMode.Default,
    title: 'Properties',
    icon: 'code',
    shortcut: 'p',
    action: action.PANEL_SET_PROPERTY_MODE,
  },
  Custom: {
    id: cd.PropertyMode.Custom,
    title: 'Custom',
    icon: 'code',
    shortcut: 'e',
    action: action.PANEL_SET_PROPERTY_MODE,
  },
};

export const dbContentTypeToActionMap: { [contentType: string]: string } = {
  [cd.EntityType.Element]: propertiesActions.ELEMENT_PROPS,
  [cd.EntityType.DesignSystem]: designSystemActions.DESIGN_SYSTEM,
  [cd.EntityType.Asset]: assetsActions.ASSETS,
  [cd.EntityType.CommentThread]: action.COMMENT_THREAD,
  [cd.EntityType.Comment]: action.COMMENT,
};

export const InteractionConfig: IConfigRecord = {
  AddAction: {
    icon: 'bolt',
    title: 'Add Action...',
  },
  NavigateToBoard: {
    title: 'Navigate to Board',
    icon: 'arrow_right_alt',
    id: cd.ActionType.NavigateToBoard,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  NavigateToUrl: {
    title: 'Navigate to URL',
    icon: 'link',
    id: cd.ActionType.NavigateToUrl,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  PresentModal: {
    title: 'Present Modal',
    icon: 'present_to_all',
    id: cd.ActionType.PresentModal,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  ExitModal: {
    title: 'Exit Modal',
    icon: 'exit_to_app',
    id: cd.ActionType.ExitModal,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  OpenDrawer: {
    title: 'Open Drawer',
    icon: 'side_navigation',
    id: cd.ActionType.OpenDrawer,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  CloseDrawer: {
    title: 'Close Drawer',
    icon: 'keyboard_return',
    id: cd.ActionType.CloseDrawer,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  SwapPortal: {
    title: 'Swap Portal',
    icon: '/assets/icons/board-portal.svg',
    id: cd.ActionType.SwapPortal,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  Snackbar: {
    title: 'Snackbar',
    icon: 'notifications',
    id: cd.ActionType.Snackbar,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  RecordState: {
    title: 'Record State',
    icon: 'fiber_manual_record',
    id: cd.ActionType.RecordState,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  ResetState: {
    title: 'Reset State',
    icon: 'refresh',
    id: cd.ActionType.ResetState,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  PostMessage: {
    title: 'Post Message',
    icon: 'call_made',
    id: cd.ActionType.PostMessage,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  RunJS: {
    title: 'Run JS Code',
    icon: 'code',
    id: cd.ActionType.RunJS,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  ScrollTo: {
    title: 'Scroll to',
    icon: 'swap_vert',
    id: cd.ActionType.ScrollTo,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  PresentOverlay: {
    title: 'Show Overlay',
    icon: 'tooltip',
    id: cd.ActionType.PresentOverlay,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
  CloseOverlay: {
    title: 'Close Overlay',
    icon: 'cancel_presentation',
    id: cd.ActionType.CloseOverlay,
    action: action.ELEMENT_PROPS_ADD_INTERACTION,
  },
};
