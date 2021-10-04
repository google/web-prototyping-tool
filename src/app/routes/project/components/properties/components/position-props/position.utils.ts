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

import { createPixelIValue } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

export interface ISvgLine {
  id: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

const getBlankValuesForSides = (aTop = false, aLeft = false, aRight = false, aBottom = false) => {
  const value = ivalueFromValue(0);
  return {
    top: aTop ? { ...value } : null,
    left: aLeft ? { ...value } : null,
    right: aRight ? { ...value } : null,
    bottom: aBottom ? { ...value } : null,
  };
};

export const getNewModelValues = (
  parentFrame: cd.ILockingRect | undefined,
  frame: cd.ILockingRect | undefined,
  model: cd.IStyleDeclaration,
  aTop = false,
  aLeft = false,
  aRight = false,
  aBottom = false
) => {
  if (!parentFrame || !frame) return getBlankValuesForSides(aTop, aLeft, aRight, aBottom);
  const { width: parentWidth, height: parentHeight } = parentFrame;
  const { width, height } = frame;
  const { top: mTop, left: mLeft, bottom: mBottom, right: mRight } = model;
  const topValue = mBottom ? parentHeight - height - mBottom?.value : 0;
  const topIValue = ivalueFromValue(topValue);
  const top = aTop ? mTop || { ...topIValue } : null;
  const leftValue = mRight ? parentWidth - width - mRight?.value : 0;
  const leftIValue = ivalueFromValue(leftValue);
  const left = aLeft ? mLeft || { ...leftIValue } : null;
  const rightValue = mLeft ? parentWidth - width - mLeft?.value : 0;
  const rightIValue = ivalueFromValue(rightValue);
  const right = aRight ? mRight || { ...rightIValue } : null;
  const bottomValue = mTop ? parentHeight - height - mTop?.value : 0;
  const bottomIValue = ivalueFromValue(bottomValue);
  const bottom = aBottom ? mBottom || { ...bottomIValue } : null;
  return { top, left, right, bottom };
};

export const ivalueFromValue = (num: string | number | undefined): cd.IValue | null => {
  if (num === undefined) return null;
  const value = parseFloat(String(num));
  return createPixelIValue(value);
};
