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

let _ctx: OffscreenCanvasRenderingContext2D;

/**
 * Measure text width using canvas and the font styles
 */
export const measureTextWidth = (text: string, font: string): number => {
  if (!_ctx) {
    const canvas = new OffscreenCanvas(0, 0);
    _ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  }

  if (!_ctx) return 0;

  _ctx.font = font;
  return _ctx.measureText(text).width;
};
