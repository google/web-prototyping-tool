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

export enum IconStyle {
  MATERIAL_ICONS_FILLED,
  MATERIAL_ICONS_OUTLINED,
  MATERIAL_ICONS_ROUNDED,
  MATERIAL_ICONS_SHARP,
}

export const ICON_FONT_FAMILY: ReadonlyRecord<IconStyle, string> = {
  [IconStyle.MATERIAL_ICONS_FILLED]: 'Material Icons',
  [IconStyle.MATERIAL_ICONS_OUTLINED]: 'Material Icons Outlined',
  [IconStyle.MATERIAL_ICONS_ROUNDED]: 'Material Icons Round',
  [IconStyle.MATERIAL_ICONS_SHARP]: 'Material Icons Sharp',
};

export const ICON_STYLE_CLASSES: ReadonlyRecord<IconStyle, string> = {
  [IconStyle.MATERIAL_ICONS_FILLED]: 'material-icons',
  [IconStyle.MATERIAL_ICONS_OUTLINED]: 'material-icons-outlined',
  [IconStyle.MATERIAL_ICONS_ROUNDED]: 'material-icons-round',
  [IconStyle.MATERIAL_ICONS_SHARP]: 'material-icons-sharp',
};

export const ORDERED_ICON_STYLES: Array<IconStyle> = [
  IconStyle.MATERIAL_ICONS_FILLED,
  IconStyle.MATERIAL_ICONS_OUTLINED,
  IconStyle.MATERIAL_ICONS_ROUNDED,
  IconStyle.MATERIAL_ICONS_SHARP,
];

export const ICON_FONT_FAMILY_CLASS_MAP = {
  [ICON_FONT_FAMILY[IconStyle.MATERIAL_ICONS_FILLED]]:
    ICON_STYLE_CLASSES[IconStyle.MATERIAL_ICONS_FILLED],
  [ICON_FONT_FAMILY[IconStyle.MATERIAL_ICONS_OUTLINED]]:
    ICON_STYLE_CLASSES[IconStyle.MATERIAL_ICONS_OUTLINED],
  [ICON_FONT_FAMILY[IconStyle.MATERIAL_ICONS_ROUNDED]]:
    ICON_STYLE_CLASSES[IconStyle.MATERIAL_ICONS_ROUNDED],
  [ICON_FONT_FAMILY[IconStyle.MATERIAL_ICONS_SHARP]]:
    ICON_STYLE_CLASSES[IconStyle.MATERIAL_ICONS_SHARP],
};

export const ICON_FONT_FAMILY_STYLE_MAP = {
  [ICON_FONT_FAMILY[IconStyle.MATERIAL_ICONS_FILLED]]: IconStyle.MATERIAL_ICONS_FILLED,
  [ICON_FONT_FAMILY[IconStyle.MATERIAL_ICONS_OUTLINED]]: IconStyle.MATERIAL_ICONS_OUTLINED,
  [ICON_FONT_FAMILY[IconStyle.MATERIAL_ICONS_ROUNDED]]: IconStyle.MATERIAL_ICONS_ROUNDED,
  [ICON_FONT_FAMILY[IconStyle.MATERIAL_ICONS_SHARP]]: IconStyle.MATERIAL_ICONS_SHARP,
};
