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

import { generateBounds } from './canvas.utils';
import { distance, createPoint, IPoint } from 'cd-utils/geometry';
import { generateFrame } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

const buildDimensions = (width = 0, height = 0): cd.Dimensions => ({ width, height });

const roundRectValues = (frame: cd.IRect): cd.IRect => {
  const width = Math.round(frame.width);
  const height = Math.round(frame.height);
  const x = Math.round(frame.x);
  const y = Math.round(frame.y);
  return { x, y, width, height };
};

/**
 * Sort distance to top left corner and round width and height
 */
const sortAndRoundFrames = (frames: cd.IRect[], topLeft: IPoint): cd.IRect[] => {
  return frames
    .sort(({ x: ax, y: ay }, { x: bx, y: by }) => {
      const a = createPoint(ax, ay);
      const b = createPoint(bx, by);
      return distance(topLeft, a) - distance(topLeft, b);
    })
    .map(roundRectValues);
};

const canMoveLeft = (
  packed: cd.IRect[],
  x: number,
  y: number,
  height: number,
  topLeft: IPoint
): boolean => {
  if (x <= topLeft.x) return false;
  const bottom = y + height;
  for (const rect of packed) {
    const right = rect.x + rect.width;
    const packBottom = rect.y + rect.height;
    if (y >= packBottom) continue;
    if (bottom <= rect.y) continue;
    if (x <= right && x >= rect.x) return false;
  }
  return true;
};

const canMoveUp = (
  packed: cd.IRect[],
  x: number,
  y: number,
  width: number,
  topLeft: IPoint
): boolean => {
  if (y <= topLeft.y) return false;
  const right = x + width;
  for (const rect of packed) {
    const packRight = rect.x + rect.width;
    const packBottom = rect.y + rect.height;
    if (x >= packRight) continue;
    if (right <= rect.x) continue;
    if (y <= packBottom && y >= rect.y) return false;
  }
  return true;
};

const moveFrame = (
  packed: cd.IRect[],
  x: number,
  y: number,
  width: number,
  height: number,
  topLeft: IPoint
): [number, number] => {
  while (canMoveLeft(packed, x, y, height, topLeft)) x--;
  while (canMoveUp(packed, x, y, width, topLeft)) y--;
  if (canMoveLeft(packed, x, y, height, topLeft)) {
    return moveFrame(packed, x, y, width, height, topLeft); // repeat
  }
  return [x, y];
};

const packFrames = (packed: cd.IRect[], rect: cd.IRect, topLeft: IPoint): cd.IRect => {
  const [x, y] = moveFrame(packed, rect.x, rect.y, rect.width, rect.height, topLeft);
  return { ...rect, x, y };
};

export const packRectanglesAndGenerateBounds = (frames: cd.IRect[]): cd.Dimensions => {
  const [sx, sy] = generateBounds(frames);
  const topLeft = createPoint(Math.round(sx), Math.round(sy));
  const sortedRects = sortAndRoundFrames(frames, topLeft);
  const packedRects = sortedRects.reduce<cd.IRect[]>((packed, rect, idx) => {
    if (idx === 0) {
      const { x, y } = topLeft;
      packed.push(generateFrame(x, y, rect.width, rect.height));
    } else {
      packed.push(packFrames(packed, rect, topLeft));
    }
    return packed;
  }, []);
  const [, , width, height] = generateBounds(packedRects);

  return buildDimensions(Math.ceil(width), Math.ceil(height));
};
