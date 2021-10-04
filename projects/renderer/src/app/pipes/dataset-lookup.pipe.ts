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
import { rendererState } from '../state.manager';
import { BUILT_IN_DATASET_LOOKUP } from 'cd-common/datasets';
import { IDataBoundValue } from 'cd-interfaces';
import { isDataBoundValue, lookupDataBoundValue } from 'cd-common/utils';

@Pipe({ name: 'datasetLookupPipe' })
export class DatasetLookupPipe implements PipeTransform {
  transform(data: string | IDataBoundValue | undefined, _refreshTrigger: Symbol): any | undefined {
    if (!data) return undefined;
    const { mergedProperties, loadedData } = rendererState;

    /** If dataset is specified as an IDataBoundValue simply return the lookup */
    if (isDataBoundValue(data)) {
      return lookupDataBoundValue(data, mergedProperties, loadedData);
    }

    // If the data for this dataset has already been loaded just return it
    if (loadedData[data]) return loadedData[data];

    // If this is a built-in dataset and its data has not been loaded,
    // trigger rendererState to load it
    if (BUILT_IN_DATASET_LOOKUP[data]) rendererState.loadDataForBuiltInDataset(data);

    return undefined;
  }
}
