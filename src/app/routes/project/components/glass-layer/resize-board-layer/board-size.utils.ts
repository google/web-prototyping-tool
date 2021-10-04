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

import { sizeConfig } from '../../../configs/root-element.properties.config';
import { approxDist } from 'cd-utils/geometry';

export interface IBoardItem {
  id: string;
  title: string;
  width: number;
  height: number;
}

const sortedSizes = [...sizeConfig].sort((a, b) => {
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  if (areaA < areaB) return -1;
  return 1;
});

const SNAP_THRESHOLD = 260;

export const generateBoardSizes = (resizeWidth: number, resizeHeight: number): IBoardItem[] => {
  const flip = resizeHeight > resizeWidth;
  const resizeCorner = { x: resizeWidth, y: resizeHeight };
  for (const rect of sortedSizes) {
    const w = rect.width > rect.height ? rect.width : rect.height;
    const h = rect.height < rect.width ? rect.height : rect.width;
    const width = flip ? h : w;
    const height = flip ? w : h;
    const boardCorner = { x: width, y: height };
    if (approxDist(boardCorner, resizeCorner) < SNAP_THRESHOLD) {
      if (width >= resizeWidth && height >= resizeHeight) {
        return [{ ...rect, width, height }];
      }
    }
  }

  return [];
};

export const areSizesEqual = (prev: IBoardItem[], next: IBoardItem[]): boolean => {
  if (prev.length !== next.length) return false;
  return prev.every((item, idx) => {
    const ref = next[idx];
    return ref.width === item.width && ref.height === item.height;
  });
};
