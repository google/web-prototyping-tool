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

import { createPoint, IPoint } from 'cd-utils/geometry';
import { half } from 'cd-utils/numeric';
import { ActionOverlayPosition } from 'cd-interfaces';

const getYPosition = (
  position: ActionOverlayPosition,
  alignment: ActionOverlayPosition,
  bounds: DOMRect,
  contentHeight: number,
  spacing: number
): number => {
  const { top, bottom, height } = bounds;
  if (position === ActionOverlayPosition.Bottom) return bottom + spacing;
  if (position === ActionOverlayPosition.Top) return top - contentHeight - spacing;
  if (position === ActionOverlayPosition.Left || position === ActionOverlayPosition.Right) {
    if (alignment === ActionOverlayPosition.Top) return top;
    if (alignment === ActionOverlayPosition.Bottom) return top + height - contentHeight;
  }
  return top + half(height) - half(contentHeight); // Center
};

const getCenterX = (left: number, width: number, contentWidth: number): number => {
  return left + half(width) - half(contentWidth);
};

const getXPosition = (
  position: ActionOverlayPosition,
  alignment: ActionOverlayPosition,
  bounds: DOMRect,
  contentWidth: number,
  spacing: number
): number => {
  const { left, right, width } = bounds;
  if (position === ActionOverlayPosition.Center) return getCenterX(left, width, contentWidth);
  if (position === ActionOverlayPosition.Left) return left - contentWidth - spacing;
  if (position === ActionOverlayPosition.Right) return right + spacing;
  // Alignment
  if (alignment === ActionOverlayPosition.Left) return left;
  if (alignment === ActionOverlayPosition.Right) return left + width - contentWidth;
  if (alignment === ActionOverlayPosition.Center) return getCenterX(left, width, contentWidth);
  return 0;
};

const getBoardXPosition = (
  position: ActionOverlayPosition,
  alignment: ActionOverlayPosition,
  bounds: DOMRect,
  contentWidth: number,
  spacing: number
): number => {
  const { width } = bounds;
  if (position === ActionOverlayPosition.Left || alignment === ActionOverlayPosition.Left) {
    return spacing;
  }

  if (position === ActionOverlayPosition.Right || alignment === ActionOverlayPosition.Right) {
    return width - contentWidth - spacing;
  }
  return half(width) - half(contentWidth);
};

const getBoardYPosition = (
  position: ActionOverlayPosition,
  alignment: ActionOverlayPosition,
  bounds: DOMRect,
  contentHeight: number,
  spacing: number
): number => {
  const { height } = bounds;
  if (position === ActionOverlayPosition.Top) return spacing;
  if (position === ActionOverlayPosition.Bottom) return height - contentHeight - spacing;
  if (position === ActionOverlayPosition.Left || position === ActionOverlayPosition.Right) {
    if (alignment === ActionOverlayPosition.Top) return spacing;
    if (alignment === ActionOverlayPosition.Bottom) return height - contentHeight - spacing;
  }
  return half(height) - half(contentHeight);
};

const getPositionForBoard = (
  position: ActionOverlayPosition,
  alignment: ActionOverlayPosition,
  contentWidth: number,
  contentHeight: number,
  bounds: DOMRect,
  spacing: number
): IPoint => {
  const x = getBoardXPosition(position, alignment, bounds, contentWidth, spacing);
  const y = getBoardYPosition(position, alignment, bounds, contentHeight, spacing);
  return createPoint(x, y);
};

export const calculatePosition = (
  position: ActionOverlayPosition,
  alignment: ActionOverlayPosition,
  contentWidth: number,
  contentHeight: number,
  bounds: DOMRect,
  spacing: number,
  isTriggerBoard: boolean
): IPoint => {
  if (isTriggerBoard) {
    return getPositionForBoard(position, alignment, contentWidth, contentHeight, bounds, spacing);
  } else {
    const x = getXPosition(position, alignment, bounds, contentWidth, spacing);
    const y = getYPosition(position, alignment, bounds, contentHeight, spacing);
    return createPoint(x, y);
  }
};

// export const constrainPointToWindow = (
//   containerRect: DOMRect,
//   pt: IPoint,
//   win: Window,
//   spacing: number
// ): IPoint => {
//   const { x, y } = pt;
//   const { width, height } = containerRect;
//   const { innerWidth, innerHeight, outerHeight, screenY, screenX } = win;
//   const { availLeft = 0, availTop = 0, availHeight, availWidth } = <any>win.screen;

//   // Checks to see if the overlay is cut off by the browser window position
//   const h = availHeight - screenY - outerHeight + availTop;
//   const w = availWidth - screenX - innerWidth + availLeft;
//   const hy = h < 0 ? innerHeight + h : innerHeight;
//   const hx = w < 0 ? innerWidth + w : innerWidth;
//   const xp = clamp(x, spacing, hx - width - spacing);
//   const yp = clamp(y, spacing, hy - height - spacing);
//   return createPoint(Math.round(xp), Math.round(yp));
// };
