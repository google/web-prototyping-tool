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

export const SELECT_INPUT = `cd-select-input`;

export const INPUT_GROUP = (label: string) => `cd-input-group[label="${label}"]`;
export const INPUT_GROUP_NG_REFLECT_LABEL = (label: string) =>
  `cd-input-group[ng-reflect-label="${label}"]`;

export const INPUT_DEEP_INPUT = 'cd-input input';
export const INPUT_DEEP_INPUT_BY_LABEL = (bottomLabel: string) =>
  `cd-input[bottomlabel="${bottomLabel}"] input`;
export const INPUT_DEEP_INPUT_BY_TYPE = (type: string) => `cd-input[type="${type}"] input`;
export const INPUT_DEEP_INPUT_BY_NTH_TYPE = (type: string, n: number) =>
  `cd-input[type="${type}"]:nth-of-type(${n}) input`;

export const CD_COLOR_INPUT = 'cd-color-input';
export const CD_COLOR_INPUT_SHOW_CHIP = 'show-chip';
export const CHIP_CLOSE_BUTTON = '.close-btn';
