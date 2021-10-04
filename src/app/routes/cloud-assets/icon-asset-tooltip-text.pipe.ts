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

import * as cd from 'cd-interfaces';

const DEFAULT_TOOLTIP_STRING = 'Product icon';

@Pipe({ name: 'iconAssetTooltipText' })
export class IconAssetTooltipTextPipe implements PipeTransform {
  transform(product: string, variant: string = ''): string {
    if (!product) return DEFAULT_TOOLTIP_STRING;
    return variant ? this.getTextWithVariation(product, variant) : product;
  }

  private getTextWithVariation(product: string, variant: string) {
    const variationParts = variant.split('-');
    const variationName = variationParts[variationParts.length - 1];
    const variation = variationName.split('.')[0];
    const firstLetter = variation[0].toUpperCase();
    const restOfString = variation.slice(1);
    const capitalizedVariation = `${firstLetter}${restOfString}`;

    return `Copy the url for ${product} - ${capitalizedVariation}`;
  }
}

@Pipe({ name: 'isAlpha' })
export class VariantIsAlphaPipe implements PipeTransform {
  transform(value: string | undefined): boolean {
    return value === 'alpha';
  }
}

@Pipe({ name: 'buildImageSource' })
export class BuildImageSourcePipe implements PipeTransform {
  transform(value: string | undefined, product: cd.IAssetsImporterItem): string {
    return `${product.dir}/${value}`;
  }
}
