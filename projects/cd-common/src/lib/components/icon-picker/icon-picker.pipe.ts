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

import { filterIcons, filterMaterialIcons } from './icon-picker.utils';
import { removeCamelAndSnakeCase } from 'cd-utils/string';
import { Pipe, PipeTransform } from '@angular/core';
import { isMaterialIcon } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

@Pipe({ name: 'iconNamePipe' })
export class IconNamePipe implements PipeTransform {
  transform(value?: cd.SelectedIcon): string | null {
    if (!value) return null;
    const name = isMaterialIcon(value) ? value : value.name;
    return removeCamelAndSnakeCase(name);
  }
}

@Pipe({ name: 'filterMatIconsPipe' })
export class FilterMatIconsPipe implements PipeTransform {
  transform(iconCategories: ReadonlyArray<cd.ICategory> | null, filter: string): cd.ICategory[] {
    if (!iconCategories) return [];
    return filterMaterialIcons(filter, iconCategories);
  }
}

@Pipe({ name: 'filterIconsPipe' })
export class FilterIconsPipe implements PipeTransform {
  transform(
    iconsets: ReadonlyArray<cd.IProcessedIconset> | null,
    filter: string,
    allowedIconSets?: string[]
  ): cd.IIconset[] {
    if (!iconsets) return [];
    return filterIcons(filter, iconsets, allowedIconSets);
  }
}

@Pipe({ name: 'iconSizeDisabledPipe' })
export class IconSizeDisabledPipe implements PipeTransform {
  transform(size: cd.IconSize, iconSizesAllowed?: cd.IconSize[]): boolean {
    if (!iconSizesAllowed) return false;
    return !iconSizesAllowed.includes(size);
  }
}
