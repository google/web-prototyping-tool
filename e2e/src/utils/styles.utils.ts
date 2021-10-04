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

import { hex2rgb } from 'cd-utils/color';
import { toDecimal } from 'cd-utils/numeric';
import { IBorder, IHexColor, IShadow } from '../models/props.interfaces';

export const cssNth = (index: number) => index + 1;

export const hexColorToRGB = (color: IHexColor): string => {
  const { hex, opacityPercentage } = color;
  const [r, g, b] = hex2rgb(hex);

  if (opacityPercentage && opacityPercentage < 100) {
    const a = toDecimal(opacityPercentage).toString();
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  return `rgb(${r}, ${g}, ${b})`;
};

export const cssBorder = (border: IBorder): string => {
  const { width, style, color } = border;

  return `${width}px ${style} ${hexColorToRGB(color)}`;
};

export const cssShadow = (inner: boolean, shadow: IShadow): string => {
  const { color, x, y, b, s } = shadow;
  const insetString = inner ? ' inset' : '';

  return `${hexColorToRGB(color)} ${x}px ${y}px ${b}px ${s}px${insetString}`;
};
