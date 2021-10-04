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

import { buildMenuForName, buildCssMenuForName } from './key-value.utils';
import { Pipe, PipeTransform } from '@angular/core';
import { cssColorProps } from 'cd-metadata/css';
import { isIValue, validAttrForKeyValue, validCSSForKeyValue } from 'cd-common/utils';
import { InputValidationMode } from 'cd-common/consts';
import * as cd from 'cd-interfaces';

@Pipe({ name: 'KeyValueWidthPipe' })
export class KeyValueWidthPipe implements PipeTransform {
  transform(str: number | string | undefined): string {
    if (!str) return '';
    const OFFSET = 0.2;
    const SUFFIX = 'ch';
    const value = String(str).length + OFFSET;
    return `${value}${SUFFIX}`;
  }
}

@Pipe({ name: 'KeyValueShowColorPipe' })
export class KeyValueShowColorPipe implements PipeTransform {
  transform(name: string): boolean {
    return cssColorProps.indexOf(name) !== -1;
  }
}

@Pipe({ name: 'KeyValueColorPipe' })
export class KeyValueColorPipe implements PipeTransform {
  transform(keyValue: cd.IKeyValue, lookup?: cd.IStringMap<cd.IDesignColor>): string | undefined {
    if (!keyValue) return undefined;
    if (isIValue(keyValue) && lookup) {
      const id = keyValue.id;
      const ref = id && lookup[id];
      if (!ref) return undefined;
      const result = (ref && ref.value) || keyValue.value;
      return result as string;
    }
    return undefined;
  }
}

@Pipe({ name: 'KeyValueBindingNamePipe' })
export class KeyValueBindingNamePipe implements PipeTransform {
  transform(value: cd.IKeyValue, designSystem?: cd.IDesignSystem): string {
    if (!value || !designSystem) return '';
    const lookups = [designSystem.colors, designSystem.variables || {}];
    if (isIValue(value) && lookups.length && value.id) {
      const id = value.id;
      for (const lookup of lookups) {
        const ref = lookup[id];

        if (ref) {
          const suffix = `${ref.value}${(ref as cd.IValue)?.units || ''}`;
          return `${ref.name} - ${suffix}`;
        }
      }
    }
    return '';
  }
}

@Pipe({ name: 'menuForKeyPipe' })
export class MenuForKeyPipe implements PipeTransform {
  transform(menuData: string[]): cd.ISelectItem[] {
    return menuData
      .map((title) => ({ title, value: title }))
      .sort((a, b) => {
        const aTitle = a.title.toLocaleLowerCase();
        const bTitle = b.title.toLocaleLowerCase();
        if (aTitle.includes(bTitle)) return 1;
        if (bTitle.includes(aTitle)) return -1;
        return 0;
      });
  }
}

@Pipe({ name: 'menuForValuePipe' })
export class MenuForValuePipe implements PipeTransform {
  transform(
    key: string,
    valueMenuDataMap: cd.IStringMap<string[]>,
    designSystem?: cd.IDesignSystem
  ): cd.ISelectItem[] {
    const zeroMapEntries = Object.keys(valueMenuDataMap).length === 0;
    if (zeroMapEntries && designSystem) return buildCssMenuForName(key, designSystem);
    return buildMenuForName(key, valueMenuDataMap);
  }
}

@Pipe({ name: 'menuForChipPipe' })
export class MenuForChipPipe implements PipeTransform {
  transform(key: string, designSystem?: cd.IDesignSystem): cd.ISelectItem[] {
    return designSystem ? buildCssMenuForName(key, designSystem, true) : [];
  }
}

const indexOfInvalid = (
  arr: ReadonlyArray<cd.IKeyValue>,
  item: cd.IKeyValue,
  index: number
): number => {
  return arr.findIndex(({ name, disabled, invalid }, idx) => {
    return name === item.name && idx > index && disabled === true && invalid === false;
  });
};

@Pipe({ name: 'showWarningPipe' })
export class ShowWarningPipe implements PipeTransform {
  transform(i: number, keyList: ReadonlyArray<cd.IKeyValue>): boolean {
    const warning = keyList.map((item, index, arr) => {
      if (item.invalid) return true;
      const found = indexOfInvalid(arr, item, index);
      return found !== -1;
    });
    return warning[i];
  }
}

@Pipe({ name: 'checkInvalidPipe' })
export class CheckInvalidPipe implements PipeTransform {
  transform(item: cd.IKeyValue, inputMode: InputValidationMode): boolean {
    const disabled = !!item.disabled;
    if (inputMode === InputValidationMode.CSS) return disabled || !validCSSForKeyValue(item);
    if (inputMode === InputValidationMode.HTML_ATTR) return disabled || !validAttrForKeyValue(item);
    return disabled;
  }
}
