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

const isGenericListItemSelected = (
  index: number,
  item: cd.IGenericConfig,
  selectedIndex: number,
  multiSelect = false
) => {
  if (!multiSelect) return index === selectedIndex;
  return Boolean(item.selected);
};

@Pipe({ name: 'isGenericListItemSelectedPipe' })
export class IsGenericListItemSelectedPipe implements PipeTransform {
  transform(
    index: number,
    item: cd.IGenericConfig,
    selectedIndex: number,
    multiSelect = false
  ): boolean {
    return isGenericListItemSelected(index, item, selectedIndex, multiSelect);
  }
}

const DESELECT_TOOLTIP = 'Deselect';
const SELECT_TOOLTIP = 'Select';

@Pipe({ name: 'genericListItemCheckboxTooltipPipe' })
export class GenericListItemCheckboxTooltipPipe implements PipeTransform {
  transform(
    index: number,
    item: cd.IGenericConfig,
    selectedIndex: number,
    multiSelect = false
  ): string {
    const itemSelected = isGenericListItemSelected(index, item, selectedIndex, multiSelect);
    return itemSelected ? DESELECT_TOOLTIP : SELECT_TOOLTIP;
  }
}
