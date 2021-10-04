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

import type { IValue, IKeyValue } from 'cd-interfaces';
import { isObjectLegacy } from 'cd-utils/object';

export const isIValue = (item: any): item is IValue => {
  return item?.value !== undefined || item?.id !== undefined;
};

export const valueFromIValue = (item: any): any => {
  if (!item) return;
  if (isIValue(item)) return item.value;
  return item;
};

/** Converts an existing object or individual value to an IValue. */
export const iValueFromAny = (item: string | number | IValue | {}): IValue => {
  // Could be any object, such as ISelectItem
  if (isObjectLegacy(item)) {
    const value = item as IValue;
    const result: IValue = {};
    if (value.id) result.id = value.id;
    if (value.value) result.value = value.value;
    if (value.index) result.index = value.index;
    if (value.units) result.units = value.units;
    return result;
  }
  // An individual string/number value, convert to IValue
  return { value: item } as IValue;
};

export const convertKeyValuesToMap = (keyValues: IKeyValue[]) => {
  return keyValues.reduce<Record<string, IKeyValue>>((acc, curr) => {
    acc[curr.name] = curr;
    return acc;
  }, {});
};

export const validCSSForKeyValue = ({ name, value }: IKeyValue): boolean => {
  return CSS.supports(name, String(value));
};

const NAME_START_CHAR = `:|A-Z|_|a-z|\u{C0}-\u{D6}|\u{D8}-\u{F6}|\u{F8}-\u{2FF}|\u{370}-\u{37D}|\u{37F}-\u{1FFF}|\u{200C}-\u{200D}|\u{2070}-\u{218F}|\u{2C00}-\u{2FEF}|\u{3001}-\u{D7FF}|\u{F900}-\u{FDCF}|\u{FDF0}-\u{FFFD}`;
const NAME_CHAR = `${NAME_START_CHAR}|\\-|.|0-9|\u{B7}|\u{0300}-\u{036F}|\u{203F}-\u{2040}`;
const VALID_ATTR_PATTERN_REGEX = new RegExp(`^[${NAME_START_CHAR}]+[${NAME_CHAR}]*$`);

export const validAttrForKeyValue = ({ name }: IKeyValue): boolean => {
  return VALID_ATTR_PATTERN_REGEX.test(name);
};
