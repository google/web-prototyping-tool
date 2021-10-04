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

import { IValue } from 'cd-interfaces';

export const DEFAULT_SIZE_PX = 200;
export const DEFAULT_SIZE_PERCENT = 100;
export const WIDTH_PROP = 'width';
export const HEIGHT_PROP = 'height';

export type LinePropType = 'width' | 'height';
export interface ISvgLine {
  id: LinePropType;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface ISizeValues {
  width: IValue;
  height: IValue;
}

export const DEFAULT_SVG_LINES: ISvgLine[] = [
  { id: HEIGHT_PROP, x1: 27, y1: 4, x2: 27, y2: 50 },
  { id: WIDTH_PROP, x1: 4, y1: 27, x2: 50, y2: 27 },
];
