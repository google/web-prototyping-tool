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

import {
  SELECT_INPUT,
  INPUT_GROUP,
  INPUT_DEEP_INPUT,
  INPUT_DEEP_INPUT_BY_NTH_TYPE,
  CD_COLOR_INPUT,
} from './input.consts';

export const PROPS_PANEL = 'app-properties-panel';
const BOARD_SIZE_PROPS = 'cd-board-size-props';

const PROPS_PANEL_INITIAL_SIZE = `${PROPS_PANEL} cd-initial-size-props`;
export const PROPS_PANEL_INITIAL_SIZE_WIDTH = `${PROPS_PANEL_INITIAL_SIZE} ${INPUT_DEEP_INPUT_BY_NTH_TYPE(
  'number',
  1
)}`;
export const PROPS_PANEL_INITIAL_SIZE_HEIGHT = `${PROPS_PANEL_INITIAL_SIZE} ${INPUT_DEEP_INPUT_BY_NTH_TYPE(
  'number',
  2
)}`;

export const PROPS_PANEL_GENERIC_SIZE = `${PROPS_PANEL} ${BOARD_SIZE_PROPS}`;
export const PROPS_PANEL_GENERIC_SIZE_WIDTH = `${PROPS_PANEL_GENERIC_SIZE} ${INPUT_DEEP_INPUT_BY_NTH_TYPE(
  'number',
  1
)}`;
export const PROPS_PANEL_GENERIC_SIZE_HEIGHT = `${PROPS_PANEL_GENERIC_SIZE} ${INPUT_DEEP_INPUT_BY_NTH_TYPE(
  'number',
  2
)}`;
export const PROPS_PANEL_ELEM_SIZE = `${PROPS_PANEL} cd-element-size-props`;
export const PROPS_PANEL_ELEM_SIZE_WIDTH = `${PROPS_PANEL_ELEM_SIZE} ${INPUT_DEEP_INPUT_BY_NTH_TYPE(
  'units',
  1
)}`;
export const PROPS_PANEL_ELEM_SIZE_HEIGHT = `${PROPS_PANEL_ELEM_SIZE} ${INPUT_DEEP_INPUT_BY_NTH_TYPE(
  'units',
  2
)}`;

export const PROPS_PANEL_OPACITY_INPUT = `${PROPS_PANEL} ${INPUT_GROUP(
  'Opacity'
)} ${INPUT_DEEP_INPUT}`;

export const PROPS_PANEL_COLOR_INPUT = `${PROPS_PANEL} ${INPUT_GROUP('Color')} ${CD_COLOR_INPUT}`;

export const PROPS_PANEL_RADIUS_INPUT = `app-border-radius-props ${INPUT_DEEP_INPUT}`;

export const PROPS_GROUP = (title: string, attr = 'ng-reflect-group-title') =>
  `cd-property-group[${attr}="${title}"]`;
export const PROPS_GROUP_NTH_LIST_ITEM = (title: string, n: number) =>
  `${PROPS_GROUP(title)} cd-property-list-item:nth-of-type(${n})`;
export const PROPS_GROUP_ADD_BUTTON = (title: string) =>
  `${PROPS_GROUP(title)} header button[iconname="add"]`;

export const PROPS_ACTION_SELECT_INPUT = `${PROPS_GROUP('Navigation')} ${INPUT_GROUP(
  'On Click'
)} ${SELECT_INPUT}`;

export const COLOR_SWATCH = 'button.swatch-holder';

export const PROPS_NTH_BACKGROUND_COLOR = (n: number) =>
  `${PROPS_GROUP_NTH_LIST_ITEM('Background', n)}`;

export const PROPS_BACKGROUND_COLOR_SWATCH = (n: number) =>
  `${PROPS_NTH_BACKGROUND_COLOR(n)} ${COLOR_SWATCH}`;
export const PROPS_BACKGROUND_COLOR_INPUT_CHIP = (n: number) =>
  `${PROPS_NTH_BACKGROUND_COLOR(n)} cd-color-input cd-chip`;
export const PROPS_BACKGROUND_COLOR_INPUT_INPUT = (n: number) =>
  `${PROPS_NTH_BACKGROUND_COLOR(n)} cd-color-input cd-input`;

// Symbols/ngComps props: FPO, can change with how we structure overrides/inputs
export const NGCOMP_INPUT_GROUP = (label: string) => `cd-input-group[ng-reflect-label="${label}"]`;
export const PROPS_COMP_SWITCH_INPUT = (name: string) =>
  `${PROPS_GROUP('Inputs')} ${NGCOMP_INPUT_GROUP(name)} cd-switch`;

export const PROPS_PANEL_SYMBOLS_BACKGROUND = `${PROPS_PANEL} cd-background-props`;
export const PROPS_PANEL_SYMBOLS_COLOR = `${PROPS_PANEL} ${CD_COLOR_INPUT}`;
