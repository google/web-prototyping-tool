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

import { ICanvasState } from 'cd-interfaces';

export const BOARD_PADDING_MULTIPLIER = 1.2;
export const BOUNDS_PADDING = 150;
export const DEFAULT_ZOOM = 1.0;
export const INNER_PADDING = 60;
export const MAX_ZOOM = 3.0;
export const MIN_SCROLLBAR_SIZE = 50;
export const MIN_ZOOM = 0.1;
export const PAN_MULTIPLIER = 0.7;
export const ZOOM_MULTIPLIER = 0.015;
export const ZOOM_FACTOR = 2;
export const PAN_DEFAULT = 6;
export const PAN_SHIFT_KEY = 24;

export const initialCanvas: ICanvasState = {
  canvas: {
    position: {
      x: 0,
      y: 0,
      z: DEFAULT_ZOOM,
    },
    bounds: [0, 0, 0, 0],
    offset: [0, 0, 0, 0],
    viewPortWidth: 1,
    viewPortHeight: 1,
  },
};
