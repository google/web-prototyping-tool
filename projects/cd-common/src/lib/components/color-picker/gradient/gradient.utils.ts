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

import { GradientMode, IGradientStop } from 'cd-utils/color';
import { half, toDecimal } from 'cd-utils/numeric';

const MAX_ALPHA = 255;
const OFFSCREEN_CANVAS_WIDTH = 180;
const OFFSCREEN_CANVAS_HEIGHT = 10;

export const gradientString = (
  mode: GradientMode,
  stops: IGradientStop[],
  angle?: number,
  from = false
) => {
  const list = stops.map((value) => `${value.color} ${value.stop}%`).join(', ');
  const hasAngle = angle !== undefined;
  const fromValue = from ? 'from ' : '';
  const prefix = hasAngle ? `${fromValue}${angle}deg,` : '';
  const gradient = `${mode}(${prefix}${list})`;
  return gradient;
};

export const buildGradientString = (
  mode: GradientMode,
  stops: IGradientStop[],
  angle: number
): string => {
  // prettier-ignore
  switch (mode) {
    case GradientMode.Linear: return gradientString(mode, stops, angle);
    case GradientMode.Conic: return gradientString(mode, stops, angle, true);
    default: return gradientString(mode, stops);
  }
};

export const rgbaToString = (colors: Uint8ClampedArray): string => {
  const [r, g, b, a] = colors;
  const alpha = a / MAX_ALPHA;
  const values = [r, g, b, alpha].toString();
  return `rgba(${values})`;
};

export const createOffscrenCanvas = (): OffscreenCanvasRenderingContext2D => {
  const canvas = new OffscreenCanvas(OFFSCREEN_CANVAS_WIDTH, OFFSCREEN_CANVAS_HEIGHT);
  return canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
};

export const sampleGradientInCanvasAtPoint = (
  ctx: OffscreenCanvasRenderingContext2D,
  stops: IGradientStop[],
  percent: number
): string => {
  ctx.clearRect(0, 0, OFFSCREEN_CANVAS_WIDTH, OFFSCREEN_CANVAS_HEIGHT);
  const grd = ctx.createLinearGradient(0, 0, OFFSCREEN_CANVAS_WIDTH, 0);

  for (const item of stops) {
    const stop = toDecimal(item.stop);
    grd.addColorStop(stop, item.color);
  }

  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, OFFSCREEN_CANVAS_WIDTH, OFFSCREEN_CANVAS_HEIGHT);
  const y = half(OFFSCREEN_CANVAS_HEIGHT);
  const x = Math.round(percent * OFFSCREEN_CANVAS_WIDTH);
  const colorValue = ctx.getImageData(x, y, 1, 1).data;
  return rgbaToString(colorValue);
};
