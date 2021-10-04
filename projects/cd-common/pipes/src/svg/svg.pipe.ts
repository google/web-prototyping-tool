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

import { Pipe, PipeTransform } from '@angular/core';
import { svgTranslate } from 'cd-utils/css';
import { removePtFromOutletFrame, trimRect } from 'cd-common/utils';
import { half } from 'cd-utils/numeric';
import { IRect, IRenderResult } from 'cd-interfaces';

const adjustForBorderOffset = (value?: IRect, borderSize?: number): IRect | undefined => {
  if (!borderSize || !value) return fixInvalidSVGRectSize(value);
  const halfSize = half(borderSize);
  const x = value.x + halfSize;
  const y = value.y + halfSize;
  const width = value.width - borderSize;
  const height = value.height - borderSize;
  return fixInvalidSVGRectSize({ x, y, width, height });
};

const fixInvalidSVGRectSize = (value: IRect | undefined): IRect | undefined => {
  if (!value) return;
  const { width, height } = value;
  if (width > 0 && height > 0) return value;
  return { ...value, width: 0, height: 0 };
};

@Pipe({
  name: 'TranslateSVGFrame',
})
export class TranslateSVGFrame implements PipeTransform {
  transform({ x, y }: Pick<IRect, 'x' | 'y'>): string {
    return svgTranslate(x, y);
  }
}

@Pipe({
  name: 'RectToSVGStyle',
})
export class RectToSVGStyle implements PipeTransform {
  transform(elem?: IRenderResult, borderSize: number = 0, clip?: IRect): IRect | undefined {
    if (!elem) return;
    // Remove X & Y if current element is a outletFrame
    const frame = elem.rootId === elem.id ? removePtFromOutletFrame(elem.frame) : elem.frame;
    const trimmedRect = clip ? trimRect(frame, removePtFromOutletFrame(clip)) : frame;
    return adjustForBorderOffset(trimmedRect, borderSize);
  }
}

@Pipe({
  name: 'IRectToSVGStyle',
})
export class IRectToSVGStyle implements PipeTransform {
  transform(rect: IRect, clip?: IRect): IRect | undefined {
    if (!clip) return adjustForBorderOffset(rect, 0);
    const width = clip.x + clip.width;
    const height = clip.y + clip.height;
    const clipped = { ...clip, width, height };
    const trimmedRect = trimRect(rect, clipped);
    return adjustForBorderOffset(trimmedRect, 0);
  }
}
