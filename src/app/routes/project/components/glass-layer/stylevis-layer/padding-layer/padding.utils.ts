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

import { generateSVGPath } from 'cd-utils/svg';
import { clamp } from 'cd-utils/numeric';

type Point = [number, number];

export interface IPaddingPath {
  id: string;
  path: string;
}

interface IPadding {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

const generatePadding = (top = 0, left = 0, bottom = 0, right = 0): IPadding => {
  return { top, left, bottom, right };
};

export const generatePathRect = (
  x: number,
  y: number,
  width: number,
  height: number,
  padding?: IPadding
): string => {
  const { top, left, bottom, right } = padding || generatePadding();
  const maxWidth = width + x;
  const maxHeight = height + y;
  const xp = clamp(x + left, x, maxWidth);
  const yp = clamp(y + top, y, maxHeight);
  const rightEdge = clamp(maxWidth - right, xp, maxWidth);
  const bottomEdge = clamp(maxHeight - bottom, yp, maxHeight);
  const topLeft: Point = [xp, yp];
  const topRight: Point = [rightEdge, yp];
  const bottomRight: Point = [rightEdge, bottomEdge];
  const bottomLeft: Point = [xp, bottomEdge];
  const path = [topLeft, topRight, bottomRight, bottomLeft, topLeft];
  return generateSVGPath(...path);
};

export const hasValidPadding = (padding?: IPadding | undefined): boolean => {
  if (!padding) return false;
  return !Object.values(padding).every((item) => item === 0);
};
