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

import type { ReadonlyRecord } from 'cd-interfaces';

export const ColorType = {
  Text: 'Text',
  TextDark: 'TextDark',
  Border: 'Border',
  TextLight: 'TextLight',
  Primary: 'Primary',
  ElevatedSurface: 'ElevatedSurface',
  BackgroundBase: 'BackgroundBase', // Cloud Specific
  Secondary: 'Secondary',
  Success: 'Success',
  Surface: 'Surface',
  Warning: 'Warn',
} as const;

export type TColorType = typeof ColorType[keyof typeof ColorType];

export const COLOR_TYPE_NAMES: ReadonlyRecord<TColorType, string> = {
  [ColorType.Text]: 'Text',
  [ColorType.TextDark]: 'Text Dark',
  [ColorType.TextLight]: 'Text Light',
  [ColorType.ElevatedSurface]: 'Elevated Surface',
  [ColorType.BackgroundBase]: 'Background Base',
  [ColorType.Border]: 'Border',
  [ColorType.Primary]: 'Primary',
  [ColorType.Secondary]: 'Secondary',
  [ColorType.Success]: 'Success',
  [ColorType.Surface]: 'Surface',
  [ColorType.Warning]: 'Warning',
};
