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

import { GridAlign } from 'cd-interfaces';

export enum LayoutAlignment {
  TopLeft = 'Top Left',
  TopCenter = 'Top Center',
  TopRight = 'Top Right',
  Left = 'Middle Left',
  Center = 'Middle Center',
  Right = 'Middle Right',
  BottomLeft = 'Bottom Left',
  BottomCenter = 'Bottom Center',
  BottomRight = 'Bottom Right',
}

export const ALIGNMENT_TO_GRID_MAP: Record<
  LayoutAlignment,
  [align: GridAlign, justify: GridAlign]
> = {
  [LayoutAlignment.TopLeft]: [GridAlign.Start, GridAlign.Start],
  [LayoutAlignment.TopCenter]: [GridAlign.Start, GridAlign.Center],
  [LayoutAlignment.TopRight]: [GridAlign.Start, GridAlign.End],
  [LayoutAlignment.Left]: [GridAlign.Center, GridAlign.Start],
  [LayoutAlignment.Center]: [GridAlign.Center, GridAlign.Center],
  [LayoutAlignment.Right]: [GridAlign.Center, GridAlign.End],
  [LayoutAlignment.BottomLeft]: [GridAlign.End, GridAlign.Start],
  [LayoutAlignment.BottomCenter]: [GridAlign.End, GridAlign.Center],
  [LayoutAlignment.BottomRight]: [GridAlign.End, GridAlign.End],
};
