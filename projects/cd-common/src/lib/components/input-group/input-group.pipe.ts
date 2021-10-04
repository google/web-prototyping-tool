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
import { DATASET_DELIMITER, ELEMENT_PROPS_DATASET_KEY } from 'cd-common/consts';
import { iconForComponent } from 'cd-common/models';
import { isDataBoundValue } from 'cd-common/utils';
import { IDataBoundValue, PropertyModel } from 'cd-interfaces';
import { DataPickerService } from '../data-picker/data-picker.service';

@Pipe({ name: 'chipIconForBindingPipe' })
export class ChipIconForBindingPipe implements PipeTransform {
  constructor(private _dataService: DataPickerService) {}
  transform(value: IDataBoundValue | undefined): string {
    if (!isDataBoundValue(value)) return '';
    const isElementProp = value?._$coDatasetId === ELEMENT_PROPS_DATASET_KEY;
    if (!isElementProp) return '';
    const id = (value.lookupPath as string).split(DATASET_DELIMITER)?.[0];
    const data = this._dataService.getElementProperties();
    const element = data && data[id];
    return element ? iconForComponent(element as PropertyModel) : '';
  }
}

@Pipe({ name: 'inputBindingFormatterPipe' })
export class InputBindingFormatterPipe implements PipeTransform {
  constructor(private _dataService: DataPickerService) {}
  transform(value: IDataBoundValue | undefined): string {
    if (!isDataBoundValue(value)) return '';
    const { _$coDatasetId, lookupPath } = value;
    return new DataBindingFormatterPipe(this._dataService).transform(_$coDatasetId, lookupPath);
  }
}

@Pipe({ name: 'dataBindingFormatterPipe' })
export class DataBindingFormatterPipe implements PipeTransform {
  constructor(private _dataService: DataPickerService) {}
  transform(source: string | undefined, lookup: string | undefined): string {
    if (!lookup || !source) return '';
    const isElementProp = source === ELEMENT_PROPS_DATASET_KEY;
    const isRoot = lookup === source;
    const dataSource = this._dataService.dataSetForKey(source)?.name || '';
    if (isRoot) return dataSource;
    if (!isElementProp) return lookup;
    const data = this._dataService.getElementProperties();
    const [id, , ...rest] = lookup.split(DATASET_DELIMITER);
    const key = (id && data && data[id]?.name) || '';
    const suffix = rest?.length ? `${DATASET_DELIMITER}${rest.join(DATASET_DELIMITER)}` : '';
    return key + suffix;
  }
}
