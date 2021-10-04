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

import type { IStyleDeclaration } from 'cd-interfaces';

export const isBorderSet = (style?: IStyleDeclaration): boolean => {
  if (!style) return false;
  const { border, borderTop, borderRight, borderBottom, borderLeft } = style;
  return !!(border || borderTop || borderRight || borderBottom || borderLeft);
};

export const resetBorder = (settingEdge: boolean): IStyleDeclaration => {
  return settingEdge
    ? {
        border: null,
      }
    : {
        border: null,
        borderTop: null,
        borderRight: null,
        borderBottom: null,
        borderLeft: null,
      };
};
