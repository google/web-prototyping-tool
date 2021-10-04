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

import { IconSize } from 'cd-interfaces';

export const ICON_ELEMENT_TAG = 'cd-icon-element';
export const USE_MAT_ICON_INPUT = 'useMatIcon';
export const ICON_NAME_VALUE = 'iconName';
export const PRIMITIVE_ICON_TAG = 'i';
export const PRIMITIVE_ICON_CLASS = 'cd-primitive-icon';
export const MAT_ICON_TAG = 'mat-icon';
export const ACE_ICON_TAG = 'ace-icon';
export const ACE_ICONSET_INPUT = 'iconset';
export const ACE_SIZE_INPUT = 'size';
export const ICON_DATA_SRC = '/assets/design-system/icons.json';
export const COMMON_ICONSET = 'common';
export const BLUR_ACTION_ICON = 'crop_free';
export const FOCUS_ACTION_ICON = 'filter_center_focus';

export const SIZE_LOOKUP = {
  [IconSize.Small]: '18',
  [IconSize.Medium]: '24',
  [IconSize.Large]: '32',
};

export const LayerIcons = {
  Home: 'home_filled',
  Board: 'crop_landscape',
  Folder: 'folder_open',
  Component: 'thermostat_carbon',
  GenericElement: '/assets/icons/element.svg',
  Icon: 'local_florist',
  Code: 'code',
} as const;
