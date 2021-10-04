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

import { EditConfig, InteractionConfig } from '../../../configs/project.config';
import { ComponentAction, IContextAction } from './context-menu-bar.interface';
import { LayerIcons } from 'cd-common/consts';
import * as actions from '../../../store/actions';
import * as cd from 'cd-interfaces';

export type ContextActions = ReadonlyArray<IContextAction>;

export const MULTI_SELECT_CONTEXT_ACTIONS: ContextActions = [
  {
    id: ComponentAction.GroupComponents,
    icon: EditConfig.Group.icon,
    tooltip: EditConfig.Group.title,
  },
  {
    id: ComponentAction.CreateSymbol,
    icon: EditConfig.CreateSymbol.icon,
    tooltip: EditConfig.CreateSymbol.title,
  },
];

const SYMBOL_ACTIONS: ContextActions = [
  {
    id: ComponentAction.EditSymbol,
    icon: EditConfig.EditSymbol.icon,
    tooltip: EditConfig.EditSymbol.title,
    action: EditConfig.EditSymbol.action,
  },
  {
    id: ComponentAction.EditSymbol,
    icon: EditConfig.UnpackSymbolInstance.icon,
    tooltip: EditConfig.UnpackSymbolInstance.title,
    action: EditConfig.UnpackSymbolInstance.action,
  },
];

const CODE_COMPONENT_ACTIONS: ContextActions = [
  {
    id: ComponentAction.EditCodeComponent,
    icon: EditConfig.EditCodeComponent.icon,
    tooltip: EditConfig.EditCodeComponent.title,
    action: EditConfig.EditCodeComponent.action,
  },
];

const IMAGE_ACTIONS: ContextActions = [
  {
    id: ComponentAction.FitAspectRatio,
    icon: 'photo_size_select_large',
    tooltip: 'Fit to aspect ratio',
    action: actions.IMAGES_FIT_TO_ASPECT_RATIO,
  },
  {
    id: ComponentAction.ResetImageSize,
    icon: 'wallpaper',
    tooltip: 'Reset image size',
    action: actions.IMAGES_RESET_SIZE,
  },
];

const BOARD_ACTIONS: ContextActions = [
  {
    id: ComponentAction.FitBoardToContent,
    icon: 'fit_screen',
    tooltip: 'Fit board to content',
    action: actions.BOARD_FIT_CONTENT,
  },
];

export const CONTEXT_ACTIONS: ContextActions = [
  {
    id: ComponentAction.AddComponent,
    icon: 'add',
    tooltip: 'Insert',
  },
  {
    id: ComponentAction.SwapIcon,
    icon: LayerIcons.Icon,
    tooltip: 'Swap icon',
  },
  {
    id: ComponentAction.LayoutPreset,
    icon: '/assets/icons/layout-preset.svg',
    tooltip: 'Layout preset...',
  },
  {
    id: ComponentAction.CreatePortalFromElements,
    icon: '/assets/icons/board-portal.svg',
    tooltip: 'Create portal from selected',
    action: actions.ELEMENT_PROPS_CREATE_PORTAL_FROM_ELEMENTS,
  },
  ...BOARD_ACTIONS,
  ...SYMBOL_ACTIONS,
  ...CODE_COMPONENT_ACTIONS,
  ...IMAGE_ACTIONS,
  {
    id: ComponentAction.ReplaceComponent,
    icon: 'swap_calls',
    tooltip: 'Replace component',
  },
  {
    id: ComponentAction.AddInteraction,
    icon: InteractionConfig.AddAction.icon,
    tooltip: InteractionConfig.AddAction.title,
  },
];

const COMPONENTS_LIST_SIZE: cd.Dimensions = { width: 192, height: 268 };
const ICON_PICKER_SIZE: cd.Dimensions = { width: 202, height: 336 };
const ADD_INTERACTION_SIZE: cd.Dimensions = { width: 160, height: 277 };
const LAYOUT_PRESET_SIZE: cd.Dimensions = { width: 192, height: 232 };

export const CONTEXT_ACTION_SIZING: Record<string, cd.Dimensions> = {
  [ComponentAction.AddComponent]: COMPONENTS_LIST_SIZE,
  [ComponentAction.ReplaceComponent]: COMPONENTS_LIST_SIZE,
  [ComponentAction.SwapIcon]: ICON_PICKER_SIZE,
  [ComponentAction.AddInteraction]: ADD_INTERACTION_SIZE,
  [ComponentAction.LayoutPreset]: LAYOUT_PRESET_SIZE,
};
