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

import * as cd from 'cd-interfaces';

export const BAR_MENU_ITEM_SIZE = 24;
export const OVERLAY_OFFSET = 10;

export const ComponentAction = {
  AddComponent: 'add_component',
  ReplaceComponent: 'replace_component',
  SwapIcon: 'swap_icon',
  GroupComponents: 'group_components',
  CreateSymbol: 'create_symbol',
  EditSymbol: 'edit_symbol',
  DetachSymbol: 'detach_symbol',
  FitAspectRatio: 'fit_aspect_ratio',
  ResetImageSize: 'reset_image_size',
  AddInteraction: 'add_interaction',
  FitBoardToContent: 'fit_board_to_content',
  EditCodeComponent: 'edit_code_component',
  CreatePortalFromElements: 'create_portals_from_elements',
  LayoutPreset: 'layout-preset',
} as const;

export type ComponentActionType = typeof ComponentAction[keyof typeof ComponentAction];

export interface IContextAction extends Pick<cd.IConfig, 'icon' | 'action' | 'disabled'> {
  id: ComponentActionType;
  tooltip: string;
}
