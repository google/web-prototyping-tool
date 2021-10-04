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

import { LayoutAlignment } from 'cd-common/consts';
import * as cd from 'cd-interfaces';

const centerPos = (p: cd.ActionOverlayPosition): boolean => p === cd.ActionOverlayPosition.Center;
const leftPos = (p: cd.ActionOverlayPosition): boolean => p === cd.ActionOverlayPosition.Left;
const rightPos = (p: cd.ActionOverlayPosition): boolean => p === cd.ActionOverlayPosition.Right;
const topPos = (p: cd.ActionOverlayPosition): boolean => p === cd.ActionOverlayPosition.Top;
const btmPos = (p: cd.ActionOverlayPosition): boolean => p === cd.ActionOverlayPosition.Bottom;

const isMiddleLeft = (p: cd.ActionOverlayPosition, a: cd.ActionOverlayPosition): boolean => {
  return (centerPos(p) && leftPos(a)) || (leftPos(p) && centerPos(a));
};

const isMiddleRight = (p: cd.ActionOverlayPosition, a: cd.ActionOverlayPosition): boolean => {
  return (centerPos(p) && rightPos(a)) || (rightPos(p) && centerPos(a));
};

const isTopCenter = (p: cd.ActionOverlayPosition, a: cd.ActionOverlayPosition): boolean => {
  return (topPos(p) && centerPos(a)) || (centerPos(p) && topPos(a));
};

const isTopLeft = (p: cd.ActionOverlayPosition, a: cd.ActionOverlayPosition): boolean => {
  return (topPos(p) && leftPos(a)) || (leftPos(p) && topPos(a));
};

const isTopRight = (p: cd.ActionOverlayPosition, a: cd.ActionOverlayPosition): boolean => {
  return (topPos(p) && rightPos(a)) || (rightPos(p) && topPos(a));
};

const isBtmCenter = (p: cd.ActionOverlayPosition, a: cd.ActionOverlayPosition): boolean => {
  return (btmPos(p) && centerPos(a)) || (centerPos(p) && btmPos(a));
};

const isBtmLeft = (p: cd.ActionOverlayPosition, a: cd.ActionOverlayPosition): boolean => {
  return (btmPos(p) && leftPos(a)) || (leftPos(p) && btmPos(a));
};

const isBtmRight = (p: cd.ActionOverlayPosition, a: cd.ActionOverlayPosition): boolean => {
  return (btmPos(p) && rightPos(a)) || (rightPos(p) && btmPos(a));
};

export const convertToLayoutAlignment = (
  position: cd.ActionOverlayPosition,
  alignment: cd.ActionOverlayPosition
): LayoutAlignment => {
  if (isTopLeft(position, alignment)) return LayoutAlignment.TopLeft;
  if (isTopCenter(position, alignment)) return LayoutAlignment.TopCenter;
  if (isTopRight(position, alignment)) return LayoutAlignment.TopRight;
  if (isMiddleLeft(position, alignment)) return LayoutAlignment.Left;
  if (isMiddleRight(position, alignment)) return LayoutAlignment.Right;
  if (isBtmLeft(position, alignment)) return LayoutAlignment.BottomLeft;
  if (isBtmCenter(position, alignment)) return LayoutAlignment.BottomCenter;
  if (isBtmRight(position, alignment)) return LayoutAlignment.BottomRight;
  return LayoutAlignment.Center;
};

export const convertFromLayoutAlignment = (
  layout: LayoutAlignment
): [position: cd.ActionOverlayPosition, alignment: cd.ActionOverlayPosition] => {
  // prettier-ignore
  switch (layout) {
    case LayoutAlignment.TopLeft:       return [cd.ActionOverlayPosition.Top, cd.ActionOverlayPosition.Left];
    case LayoutAlignment.TopRight:      return [cd.ActionOverlayPosition.Top, cd.ActionOverlayPosition.Right];
    case LayoutAlignment.TopCenter:     return [cd.ActionOverlayPosition.Top, cd.ActionOverlayPosition.Center];
    case LayoutAlignment.Left:          return [cd.ActionOverlayPosition.Left, cd.ActionOverlayPosition.Center];
    case LayoutAlignment.Right:         return [cd.ActionOverlayPosition.Right, cd.ActionOverlayPosition.Center];
    case LayoutAlignment.BottomLeft:    return [cd.ActionOverlayPosition.Bottom, cd.ActionOverlayPosition.Left];
    case LayoutAlignment.BottomRight:   return [cd.ActionOverlayPosition.Bottom, cd.ActionOverlayPosition.Right];
    case LayoutAlignment.BottomCenter:  return [cd.ActionOverlayPosition.Bottom, cd.ActionOverlayPosition.Center];
    default:                            return [cd.ActionOverlayPosition.Center, cd.ActionOverlayPosition.Center];
  }
};
