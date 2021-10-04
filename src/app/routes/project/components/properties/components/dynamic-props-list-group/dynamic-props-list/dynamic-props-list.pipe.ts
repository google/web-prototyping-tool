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
import { toSentenceCase } from 'cd-utils/string';
import * as cd from 'cd-interfaces';
import * as consts from '../../../dynamic-props-modal/dynamic-props-modal.consts';

@Pipe({ name: 'itemLabelLookupPipe' })
export class ItemLabelLookupPipe implements PipeTransform {
  transform(item: any, config?: cd.IGenericListConfig): any | undefined {
    if (!config?.listItemLabelModelKey && !config?.listItemLabelFallbackModelKey) {
      return item?.[consts.NAME_VALUE];
    }

    const { listItemLabelModelKey, listItemLabelFallbackModelKey } = config;
    const keyLookup = listItemLabelModelKey ? item?.[listItemLabelModelKey] : undefined;
    if (keyLookup) return keyLookup;

    const fallbackLookup = listItemLabelFallbackModelKey
      ? item?.[listItemLabelFallbackModelKey]
      : undefined;

    return fallbackLookup && toSentenceCase(fallbackLookup);
  }
}

const isDynamicListItemSelected = (
  index: number,
  item: consts.IInstanceInputs,
  selectedIndex: number,
  selectedValue: cd.PropertyValue,
  config?: cd.IGenericListConfig
) => {
  if (config?.supportsMultiAndSingle) {
    if (!config?.multiSelect) return selectedValue === item.value;
    if (config?.multiSelect) return (selectedValue as string[]).includes(item.value as string);
  }

  // Legacy
  // TODO: rework components using legacy multiselect/radio
  if (!config?.multiSelect) return index === selectedIndex;
  return Boolean(item.selected);
};

@Pipe({ name: 'isDynamicListItemSelectedPipe' })
export class IsDynamicListItemSelectedPipe implements PipeTransform {
  transform(
    index: number,
    item: consts.IInstanceInputs,
    selectedIndex: number,
    selectedValue: cd.PropertyValue,
    config?: cd.IGenericListConfig
  ): boolean {
    return isDynamicListItemSelected(index, item, selectedIndex, selectedValue, config);
  }
}

@Pipe({ name: 'dynamicListItemCheckboxTooltipPipe' })
export class DynamicListItemCheckboxTooltipPipe implements PipeTransform {
  transform(
    index: number,
    item: consts.IInstanceInputs,
    selectedIndex: number,
    selectedValue: cd.PropertyValue,
    config?: cd.IGenericListConfig
  ): string {
    const itemSelected = isDynamicListItemSelected(
      index,
      item,
      selectedIndex,
      selectedValue,
      config
    );
    return itemSelected ? consts.DESELECT_TOOLTIP : consts.SELECT_TOOLTIP;
  }
}
