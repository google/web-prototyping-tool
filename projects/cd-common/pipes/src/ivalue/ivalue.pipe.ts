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

import {
  valueFromIValue,
  isIValue,
  convertDataSourceLookupToKeys,
  lookupObjectValueWithKeysWithinObject,
} from 'cd-common/utils';
import { Pipe, PipeTransform } from '@angular/core';
import type { IValue, IPickerDataset } from 'cd-interfaces';
import { toPercent } from 'cd-utils/numeric';

@Pipe({
  name: 'IValueValue',
})
export class GetIValuePipe implements PipeTransform {
  transform(value: any, defaultValue: number = 0): string | number | undefined {
    return valueFromIValue(value) || defaultValue;
  }
}

@Pipe({
  name: 'IValuePercent',
})
export class GetIValuePercentPipe implements PipeTransform {
  transform(value: any, defaultValue: number = 0): number {
    const opacity = Number(valueFromIValue(value)) || defaultValue;
    return toPercent(opacity);
  }
}

@Pipe({
  name: 'IValueId',
})
export class GetIValueIDPipe implements PipeTransform {
  transform(value: any): string | undefined | null {
    const val = value as IValue;
    return val && val.id;
  }
}

@Pipe({
  name: 'IValueLookup',
})
export class IValueLookup implements PipeTransform {
  transform(value: any, lookup: any): any | undefined {
    if (!value) return;
    if (isIValue(value) && lookup && value.id) {
      const id = value.id;
      return id && lookup[id];
    }
  }
}

const dataSourceForId = (
  val: IValue | undefined,
  sources: IPickerDataset[]
): IPickerDataset | undefined => {
  if (!val) return;
  const hasValue = isIValue(val) && sources && val.id;
  if (!hasValue) return;
  const id = val.id;
  return sources.find((src) => src?.id === id);
};

@Pipe({ name: 'dataSourcesBindingPipe' })
export class DataSourcesBindingPipe implements PipeTransform {
  transform(val: IValue | undefined, sources: IPickerDataset[] = []): string | undefined {
    const source = dataSourceForId(val, sources);
    if (!source?.value) return;
    const keys = convertDataSourceLookupToKeys(val?.value as string);
    const parsed = JSON.parse(source?.value);
    const value = lookupObjectValueWithKeysWithinObject(parsed, keys);
    return JSON.stringify(value);
  }
}

@Pipe({ name: 'dataSourcesKeyPipe' })
export class DataSourcesKeyPipe implements PipeTransform {
  transform(value: string): string[] | undefined {
    const obj = JSON.parse(value);
    if (!Array.isArray(obj)) return;
    const keys = new Set(obj.flatMap(Object.keys));
    return [...keys];
  }
}
