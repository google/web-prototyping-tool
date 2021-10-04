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
import { DEFAULT_UNITS } from 'cd-common/consts';

export const DEFAULT_SIZE = 50;

export const DEFAULT_BOXSHADOW_CONFIG: cd.IShadowStyle = {
  inset: false,
  offsetX: 0,
  offsetY: 0,
  blurRadius: 1,
  spreadRadius: 1,
  units: DEFAULT_UNITS,
  color: {
    value: 'rgba(0,0,0,0.2)',
  },
};

export const DEFAULT_TEXTSHADOW_CONFIG: cd.IShadowStyle = {
  offsetX: 1,
  offsetY: 1,
  blurRadius: 1,
  units: DEFAULT_UNITS,
  color: {
    value: 'rgba(0,0,0,0.24)',
  },
};

export const DEFAULT_BORDER_CONFIG: cd.IBorderStyle = {
  borderWidth: 1,
  units: DEFAULT_UNITS,
  lineStyle: 'solid',
  borderColor: {
    value: '#000000',
  },
};

export const DEFAULT_BACKGROUND_COLOR: cd.IValue = {
  value: '#CCCCCC',
};

export const BLANK_MENU_ITEM = {
  value: '',
  title: 'None',
  type: cd.SelectItemType.Empty,
};

export const UPLOAD_MENU_ITEM: cd.ISelectItem = {
  title: 'Upload image...',
  value: 'upload',
  icon: 'file_upload',
  type: cd.SelectItemType.Icon,
  action: true,
};

export const DEFINE_COLOR_MENU_ITEM: cd.ISelectItem = {
  title: 'New theme color...',
  icon: 'styles',
  value: 'new_color',
  action: true,
  divider: true,
};

const TABLE_GUIDE_URL = '';

export const INVALID_TABLE_DATA_TOAST: Partial<cd.IToast> = {
  iconName: 'error_outline',
  message: 'Invalid data. Table data must be an array of objects',
  confirmLabel: 'View docs',
  callback: () => window.open(TABLE_GUIDE_URL),
};

export const ADD_DATASET_MENU_ITEM: cd.ISelectItem = {
  title: 'Add dataset...',
  value: 'addDataset',
  icon: 'file_upload',
  type: cd.SelectItemType.Icon,
  action: true,
};
