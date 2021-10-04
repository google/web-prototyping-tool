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
import { ConfigAction, IConfigPayload, IConfigAction } from '../../interfaces/action.interface';
import { ISelectionState } from '../../store/reducers/selection.reducer';
import { MIN_ZOOM, MAX_ZOOM } from '../../configs/canvas.config';
import { hasChildren, isSymbolInstance, lookupElementIds } from 'cd-common/models';
import { areAnyElementsVisible } from '../../utils/element-properties.utils';
import * as actions from '../../store/actions';
import * as projectConfigs from '../../configs/project.config';
import * as configs from '../../configs/context.menu.config';
import * as keyUtils from 'cd-utils/keycodes';
import * as cd from 'cd-interfaces';

export type TargetContextPayload = [IConfigPayload, cd.ConfigTargetType];
export interface IMenuActivationMap {
  [actionType: string]: (
    selection: ISelectionState,
    project: cd.IProject | undefined,
    elementProperties: cd.ElementPropertiesMap,
    canvas: cd.ICanvas | undefined
  ) => boolean;
}
/**
 * This looks through all provided configs for a keyboard shortcut
 * matching the keyboard event
 * @param key Keyboard Event key
 * @param configList List of configurations to test against
 */
const configForKey = (e: KeyboardEvent, configList: cd.IConfig[]): cd.IConfig | undefined => {
  return configList.find((item: cd.IConfig) => {
    const shortcut = item && item.shortcut;
    if (!shortcut) return false;
    const sk = Array.isArray(shortcut) ? shortcut : [shortcut];
    return keyUtils.keyEventCheck(e, ...sk);
  });
};

export const actionFromConfig = (
  config: cd.IConfig,
  payload: IConfigPayload,
  targetType: cd.ConfigTargetType
): IConfigAction | null => {
  if (!config.action) return null;
  const action = new ConfigAction(config, payload);
  action.targetType = targetType;
  action.undoable = !!config.undoable;
  return action;
};

export const configFromActionString = (action: string): cd.IConfig => {
  return { title: action, action };
};

const lookupKeyboardShortcut = (
  e: KeyboardEvent,
  payload: IConfigPayload,
  configList: cd.IConfig[]
): ConfigAction | null => {
  const item = configForKey(e, configList);
  if (!item || !item.action) return null;
  const action = new ConfigAction(item, payload, e);
  action.undoable = !!item.undoable;
  return action;
};
// prettier-ignore
export const targetTypeFromSelection = (
  selection: ISelectionState,
  symbolMode: boolean
): cd.ConfigTargetType => {
  if (!selection || selection.type === cd.EntityType.Project) return symbolMode ? cd.ConfigTargetType.CanvasSymbolMode : cd.ConfigTargetType.Canvas;
  if (selection.outletFramesSelected) return symbolMode ? cd.ConfigTargetType.Symbol : cd.ConfigTargetType.Board;
  if (selection.symbolInstancesSelected) return cd.ConfigTargetType.SymbolInstance;
  if (selection.codeComponentInstancesSelected) return cd.ConfigTargetType.CodeComponentInstance;
  return symbolMode ? cd.ConfigTargetType.ElementSymbolMode : cd.ConfigTargetType.Element;
};

const configForType = (targetType: cd.ConfigTargetType): cd.IConfig[] => {
  // prettier-ignore
  switch (targetType) {
    case cd.ConfigTargetType.Board: return configs.BoardKeyEvents;
    case cd.ConfigTargetType.Canvas: return configs.CanvasKeyEvents;
    case cd.ConfigTargetType.CanvasSymbolMode: return configs.CanvasSymbolModeKeyEvents;
    case cd.ConfigTargetType.Element: return configs.ElementKeyEvents;
    case cd.ConfigTargetType.ElementSymbolMode: return configs.ElementSymbolModeKeyEvents;
    case cd.ConfigTargetType.Symbol: return configs.SymbolKeyEvents;
    case cd.ConfigTargetType.SymbolInstance: return configs.ComponentInstanceKeyEvents;
    case cd.ConfigTargetType.CodeComponentInstance: return configs.ComponentInstanceKeyEvents;
    case cd.ConfigTargetType.CodeComponent: return configs.CodeComponentEditorKeyEvents;
    default: return [];
  }
};

const menuForTargetType = (targetType?: cd.ConfigTargetType) => {
  // prettier-ignore
  switch (targetType) {
    case cd.ConfigTargetType.Board: return configs.BoardMenu;
    case cd.ConfigTargetType.Canvas: return configs.CanvasMenu;
    case cd.ConfigTargetType.CanvasSymbolMode: return configs.CanvasSymbolIsolationModeMenu;
    case cd.ConfigTargetType.ElementSymbolMode: return configs.ElementSymbolIsolationModeMenu;
    case cd.ConfigTargetType.Symbol: return configs.BoardSymbolIsolationModeMenu;
    case cd.ConfigTargetType.SymbolInstance: return configs.SymbolInstanceMenu;
    case cd.ConfigTargetType.CodeComponentInstance: return configs.CodeComponentInstanceMenu;
    default: return configs.ElementMenu;
  }
};

export const actionFromKeyboard = (
  e: KeyboardEvent,
  payload: IConfigPayload,
  targetType: cd.ConfigTargetType
): IConfigAction | null => {
  const config = configForType(targetType);
  const action = lookupKeyboardShortcut(e, payload, config);
  if (action) action.targetType = targetType;
  return action;
};

////////////////////////////////////////////////////////////////////////////////////
// TODO Consider Refactor for cleaner implenetation not reliant on canvas
////////////////////////////////////////////////////////////////////////////////////

const isActionTypeActivated = (
  type: string,
  selection: ISelectionState,
  project: cd.IProject | undefined,
  elementProps: cd.ElementPropertiesMap,
  canvas?: cd.ICanvas
): boolean => {
  const activation = menuActivations[type];
  return activation ? activation(selection, project, elementProps, canvas) : true;
};

export const shouldEnableAction = (
  { type }: Action,
  selection: ISelectionState,
  project: cd.IProject | undefined,
  elementProps: cd.ElementPropertiesMap,
  canvas?: cd.ICanvas
): boolean => isActionTypeActivated(type, selection, project, elementProps, canvas);

export const shouldEnableMenuItem = (
  { action }: cd.IConfig,
  selection: ISelectionState,
  project: cd.IProject | undefined,
  elementProps: cd.ElementPropertiesMap,
  canvas?: cd.ICanvas
): boolean => {
  return action ? isActionTypeActivated(action, selection, project, elementProps, canvas) : true;
};

export const disableMenuItem = (item: cd.IConfig): cd.IConfig => {
  const copy = { ...item };
  copy.disabled = true;
  return copy;
};

export const getMenuFromConfig = (
  selection: ISelectionState,
  project: cd.IProject | undefined,
  elementProperties: cd.ElementPropertiesMap,
  selectedPropertyModels: cd.PropertyModel[],
  canvas?: cd.ICanvas,
  targetType?: cd.ConfigTargetType
): cd.IConfig[][] => {
  const menu = menuForTargetType(targetType);
  return menu.map((section) =>
    section.map((item) => {
      if (item.id === projectConfigs.GROUP_INTO_MENU_ITEM_ID) {
        item.children = [...configs.GroupMenuConfig];
        return item;
      }

      if (item.id === projectConfigs.TOGGLE_VISIBILITY_MENU_ITEM_ID) {
        const clone = { ...item };
        const hasVisibleElements = areAnyElementsVisible(selectedPropertyModels);
        if (hasVisibleElements) {
          clone.icon = projectConfigs.VisibilityIcon.Hidden;
          clone.title = projectConfigs.VisibilityMenuItemTitle.Hide;
        }
        return clone;
      }

      const enable = shouldEnableMenuItem(item, selection, project, elementProperties, canvas);
      return enable ? item : disableMenuItem(item);
    })
  );
};

/// END TODO /////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

export const canCreateComponentsFromSelectedProperties = (
  properties: cd.PropertyModel[]
): boolean => {
  const [first] = properties;
  if (!first) return false;
  const { elementType } = first;
  const { SymbolInstance } = cd.ElementEntitySubType;
  return elementType !== SymbolInstance;
};

const isSingleBoardSelected = (selection: ISelectionState): boolean => {
  return selection.outletFramesSelected && selection.ids.size === 1;
};

const canZoomIn = (
  _selection: ISelectionState,
  _project: cd.IProject | undefined,
  _elementProperties: cd.ElementPropertiesMap,
  canvas?: cd.ICanvas
): boolean => {
  if (!canvas) return false;
  return canvas.position.z < MAX_ZOOM;
};

const canZoomOut = (
  _selection: ISelectionState,
  _project: cd.IProject | undefined,
  _elementProperties: cd.ElementPropertiesMap,
  canvas?: cd.ICanvas
): boolean => {
  if (!canvas) return false;
  return canvas.position.z > MIN_ZOOM;
};

const canCreateSymbols = (
  selection: ISelectionState,
  _project: cd.IProject | undefined,
  elementProperties: cd.ElementPropertiesMap
): boolean => {
  const { outletFramesSelected: boardsSelected, ids } = selection;
  if (boardsSelected || ids.size === 0) return false;
  if (ids.size > 1) return true;
  const [first] = ids;
  const props = elementProperties[first];
  return !!props && canCreateComponentsFromSelectedProperties([props]);
};

const canUnpackUserSymbolInstances = (
  selection: ISelectionState,
  _project: cd.IProject | undefined,
  elementProperties: cd.ElementPropertiesMap
): boolean => {
  const { ids } = selection;
  if (ids.size === 0) return false; // Array.prototype.every() returns true for empty array
  const models = lookupElementIds([...ids], elementProperties);
  return models.every((m) => isSymbolInstance(m));
};

const canEditSymbol = (
  selection: ISelectionState,
  _project: cd.IProject | undefined,
  elementProperties: cd.ElementPropertiesMap
): boolean => {
  const { ids } = selection;
  if (ids.size !== 1) return false;
  const models = lookupElementIds([...ids], elementProperties);
  return models.every((m) => isSymbolInstance(m));
};

const isSelectedBoardNotHome = (
  selection: ISelectionState,
  project: cd.IProject | undefined,
  _elementProperties: cd.ElementPropertiesMap
): boolean => {
  const singleBoardSelected = isSingleBoardSelected(selection);
  const homeBoardId = project && project.homeBoardId;
  return singleBoardSelected && homeBoardId !== Array.from(selection.ids)[0];
};

const areBoardsOrElementsSelected = ({ type }: ISelectionState): boolean =>
  type === cd.EntityType.Element;

const canGroupSelectedElements = (
  selection: ISelectionState,
  _project: cd.IProject | undefined,
  _elementProperties: cd.ElementPropertiesMap
): boolean => {
  return !selection.outletFramesSelected && selection.ids.size >= 1;
};

const notBoardAndHasChildren = (
  selection: ISelectionState,
  _project: cd.IProject | undefined,
  elementProperties: cd.ElementPropertiesMap
): boolean => {
  if (selection.outletFramesSelected) return false;
  return Array.from(selection.ids).every((id) => hasChildren(id, elementProperties));
};

// TODO: compute this with new undo/redo system for multi-editor
const canUndo = (): boolean => true;

const canRedo = (): boolean => true;

const menuActivations: IMenuActivationMap = {
  [actions.BOARD_SET_HOME]: isSelectedBoardNotHome,
  [actions.CLIPBOARD_CUT]: areBoardsOrElementsSelected,
  [actions.CLIPBOARD_COPY]: areBoardsOrElementsSelected,
  [actions.SYMBOL_CREATE]: canCreateSymbols,
  [actions.PANEL_ISOLATE_SYMBOL]: canEditSymbol,
  [actions.SYMBOL_UNPACK_INSTANCE]: canUnpackUserSymbolInstances,
  [actions.ELEMENT_PROPS_GROUP_ELEMENTS]: canGroupSelectedElements,
  [actions.ELEMENT_PROPS_UNGROUP_ELEMENTS]: notBoardAndHasChildren,
  [actions.HISTORY_UNDO]: canUndo,
  [actions.HISTORY_REDO]: canRedo,
  [actions.ELEMENT_PROPS_DUPLICATE]: areBoardsOrElementsSelected,
  [actions.ELEMENT_PROPS_DELETE_ELEMENTS_AND_CHILDERN]: areBoardsOrElementsSelected,
  [actions.CANVAS_ZOOM_IN]: canZoomIn,
  [actions.CANVAS_ZOOM_OUT]: canZoomOut,
  [actions.CANVAS_SNAP_TO_BOARD]: areBoardsOrElementsSelected,
};

export const canUngroupSelectedProperties = (properties: cd.PropertyModel[]): boolean => {
  return properties.every((item) => item?.childIds?.length > 0);
};

export const canUnpackSymbolInstance = (properties: cd.PropertyModel[]): boolean => {
  if (properties.length === 0) return false;
  return Array.from(properties).every((prop) => isSymbolInstance(prop));
};
