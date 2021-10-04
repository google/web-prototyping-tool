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

import { ISelectItem, Units, SelectItemType } from 'cd-interfaces';
import { clamp } from 'cd-utils/numeric';
import { UnitTypes } from 'cd-metadata/units';
import { SHIFT_DOWN_AMOUNT } from './input.consts';

export const filterMenu = (filter: string, data: ReadonlyArray<ISelectItem>): ISelectItem[] => {
  const _filter = filter.toLocaleLowerCase();
  const _aFilter = Array.from(_filter);
  return data
    .filter((item) => {
      const { title = '', value = '', type, action } = item;
      if (type === SelectItemType.Empty) return false; // Always filter out empty states
      if (action) return false; // Filter out actions
      const _title = title.toLocaleLowerCase();
      const titleMatch = _title.includes(_filter);
      // When type equals Image, only filter by title because value is used by the thumbnail
      if (type === SelectItemType.Image) return titleMatch;
      const _value = String(value).toLowerCase();
      const valueMatch = _value.includes(_filter);
      return titleMatch || valueMatch;
    })
    .sort((a, b) => {
      const aTitle = a.title.toLocaleLowerCase();
      const bTitle = b.title.toLocaleLowerCase();
      const aMatch = _aFilter.every((char, idx) => char === aTitle[idx]);
      const bMatch = _aFilter.every((char, idx) => char === bTitle[idx]);
      if (aMatch && !bMatch) return -1;
      if (bMatch) return 1;
      return 0;
    });
};

// Assign an index for tracking data
export const assignMenuIndex = (data: ISelectItem[]): ISelectItem[] => {
  return data.map((item, idx) => {
    const clone = { ...item };
    clone.index = idx;
    return clone;
  });
};

export const getSelectedMenuIndex = (
  data: ReadonlyArray<ISelectItem>,
  bindingId?: string
): number =>
  data.findIndex(({ id, selected }) => (bindingId ? id === bindingId : selected === true));

export const processIncrement = (
  numberValue: number,
  direction: 1 | -1,
  holdingShift: boolean,
  step = 1,
  min = -Number.MAX_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER
): number => {
  const amount = holdingShift ? SHIFT_DOWN_AMOUNT : 1;
  const stepValue = step * amount;
  const value = numberValue + stepValue * direction;
  return clamp(value, min, max);
};

export const clampPercentageValue = (value: any, units?: Units) => {
  return units === UnitTypes.Percent ? clamp(Number(value), 0, 100) : value;
};

export const isValidValue = (value: number | undefined | string): boolean => {
  return isNaN(Number(value)) || value === '';
};
