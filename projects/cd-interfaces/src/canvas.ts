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

export type Rect = [left: number, top: number, right: number, bottom: number];

export interface ICanvasPosition {
  x: number;
  y: number;
  z: number;
}

export interface IScrollbar {
  vertSize: number;
  vertX: number;
  vertY: number;
  vertPos: number;
  horzSize: number;
  horzPos: number;
}
export interface ICanvasDimensions {
  offset: Rect;
  viewPortHeight: number;
  viewPortWidth: number;
}

export interface IRectRange {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export interface ICanvas extends ICanvasDimensions {
  bounds: Rect;
  position: ICanvasPosition;
}

export interface ICanvasState {
  canvas: ICanvas;
}
