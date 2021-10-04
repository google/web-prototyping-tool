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

import type { ILockingRect, IRect } from 'cd-interfaces';
import { clamp } from 'cd-utils/numeric';

export const generateFrame = (x = 0, y = 0, width = 0, height = 0): IRect => {
  return { x, y, width, height };
};

export const generateLockingFrame = (
  locked = false,
  x?: number,
  y?: number,
  width?: number,
  height?: number
): ILockingRect => {
  const frame = generateFrame(x, y, width, height);
  return { ...frame, locked };
};
/**
 * Takes a outletFrame Rect and removes X & Y position
 * e.g {x:0, y:0, width:200, height:200}
 * @param frame IRect
 */
export const removePtFromOutletFrame = (frame: IRect): IRect => {
  return { ...frame, x: 0, y: 0 };
};

const trimSize = (pos: number, size: number, max: number): number => {
  return size + pos > max ? max - pos : size;
};

export const trimRect = (value: IRect, clip: IRect): IRect => {
  const x = clamp(value.x, clip.x, clip.width);
  const y = clamp(value.y, clip.y, clip.height);
  const diffx = x - value.x;
  const diffy = y - value.y;
  const width = trimSize(x, value.width - diffx, clip.width);
  const height = trimSize(y, value.height - diffy, clip.height);
  return { x, y, width, height };
};

export const rectsIntersect = (rectA: IRect, rectB: IRect): boolean => {
  const checkIntersect =
    rectB.x > rectA.x + rectA.width ||
    rectB.x + rectB.width < rectA.x ||
    rectB.y > rectA.y + rectA.height ||
    rectB.y + rectB.height < rectA.y;

  return !checkIntersect;
};
