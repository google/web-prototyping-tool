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
import { DATASET_DELIMITER } from 'cd-common/consts';
import { IPickerDataset, IDataBoundValue, DataPickerType } from 'cd-interfaces';
import { toCamelCase } from 'cd-utils/string';

@Pipe({ name: 'dataSourceLookupPipe' })
export class DataPickerPipe implements PipeTransform {
  transform(
    selectedValue?: IDataBoundValue,
    sources: IPickerDataset[] = []
  ): IPickerDataset | undefined {
    const id = selectedValue?._$coDatasetId as string;
    return sources.find((item) => item.id === id);
  }
}

// Angular doesnt provide a way to iterate over numbers only collections
@Pipe({ name: 'dataIndentPipe' })
export class DataIndentPipe implements PipeTransform {
  transform(length: number): ReadonlyArray<string> {
    return Array.from({ length });
  }
}

/** this may change in the future, if we pass in elementProperties */
@Pipe({ name: 'formatSelectedValueForDataPipe' })
export class FormatSelectedValueForDataPipe implements PipeTransform {
  transform(
    selection: IDataBoundValue | undefined,
    data: IPickerDataset | undefined
  ): string | undefined {
    if (!selection || selection.lookupPath === undefined) return;
    const value = selection.lookupPath as string;
    if (data?.pickerType !== DataPickerType.ProjectElements) return value;
    if (!value || !data) return;
    const [id, , ...values] = value.split(DATASET_DELIMITER);
    if (!id || !data.value) return;
    const elemProps = JSON.parse(data.value);
    const elem = elemProps[id];
    const name = toCamelCase(elem?.name || '');
    return elem && `${name}${DATASET_DELIMITER}${values.join(DATASET_DELIMITER)}`;
  }
}

@Pipe({ name: 'activeDataSourcePipe' })
export class ActiveDataSourcePipe implements PipeTransform {
  transform(sourceId: string, selection: IDataBoundValue | undefined): boolean {
    return sourceId === selection?._$coDatasetId;
  }
}
