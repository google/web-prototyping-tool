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
import type { ITypographyStyle, IFontFamily, IStringMap } from 'cd-interfaces';
import { FontWeightMap } from 'cd-metadata/fonts';
import { styleFromWeight } from 'cd-common/utils';

@Pipe({
  name: 'FontValue',
})
export class FontValuePipe implements PipeTransform {
  transform(
    item: ITypographyStyle | undefined,
    fonts: IStringMap<IFontFamily> | undefined
  ): string {
    if (item === undefined || fonts === undefined) return '';
    const { fontId, weight, size, lineHeight } = item;
    const font = fontId && fonts[fontId];
    const family = (font && font.family) || '';
    const fntWeight = weight && FontWeightMap[weight];
    const line = lineHeight ? `/${lineHeight}` : '';
    return `${family} ${fntWeight} ${size}${line}`;
  }
}

@Pipe({
  name: 'FontStyle',
})
export class FontStylePipe implements PipeTransform {
  transform(item: ITypographyStyle | undefined, fonts: IStringMap<IFontFamily> | undefined): {} {
    if (item === undefined || fonts === undefined) return '';
    const font = item.fontId && fonts[item.fontId];
    const fontFamily = (font && font.family) || '';
    const { fontStyle, fontWeight } = styleFromWeight(item.weight as string);
    return {
      fontStyle,
      fontFamily,
      fontWeight,
    };
  }
}
