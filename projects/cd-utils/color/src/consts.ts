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

export const RGB_MAX = 255;
export const COLOR_EPSILON = 2 ** -16;
export const COLOR_MAX = 255;
export const HUE_MAX = 360;
export const LAB_EPSILON = 0.0001;
export const D65_NORMALIZATION = {
  x: 0.95047,
  y: 1,
  z: 1.08883,
};
export const RGB_REGEX = /\d+(\.\d{1,2})?/g;
export const MAX_CHROMA_MULTIPLIER = 1.25;
export const MIN_LIGHTNESS_DISTANCE = 1.7;
export const HEX_COLOR_REGEX = /#?([\da-f]{3})/gi;
export const HEX_HASH = '#';
export const TRANSPARENT = 'transparent';
