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

export const SHADOW_DIMENSION_SHORTHANDS = ['x', 'y', 'b', 's'];

export const DEFAULT_PRIMITIVE_STYLES = {
  width: '100px',
  height: '100px',
  backgroundColor: 'rgb(238, 238, 238)',
};

export const DEFAULT_ICON_STYLES = {
  width: '24px',
  height: '24px',
  color: 'rgb(95, 99, 104)',
};

export const DEFAULT_ICON_STYLE_PROPS = Object.keys(DEFAULT_ICON_STYLES);

export const DEFAULT_PRIMITIVE_STYLE_PROPS = Object.keys(DEFAULT_PRIMITIVE_STYLES);
