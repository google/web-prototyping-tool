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

import { IStringMap } from 'cd-interfaces';
const PREVIEW_VAR = '--cd-preview-fill';
const PRIMARY_COLOR_VAR = '--cd-glass-color';

export const getGlassColorFromCSSVars = (): IStringMap<string> => {
  const value = window.getComputedStyle(document.body).getPropertyValue(PRIMARY_COLOR_VAR);
  if (!value) throw new Error(PRIMARY_COLOR_VAR + ' not defined');
  return { [PREVIEW_VAR]: value };
};
