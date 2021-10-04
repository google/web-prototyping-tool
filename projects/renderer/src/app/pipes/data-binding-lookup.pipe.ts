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
import { isDataBoundValue, lookupDataBoundValue } from 'cd-common/utils';
import { rendererState } from '../state.manager';

/**
 * This pipe checks to see if an IValue is stored for a given input value. If so,
 * it looks up and returns the value stored at a bindingPath within a dataset
 */
@Pipe({ name: 'dataBindingLookupPipe' })
export class DataBindingLookupPipe implements PipeTransform {
  transform(inputValue: any, _refreshTrigger: Symbol): any | undefined {
    if (!isDataBoundValue(inputValue)) return inputValue;
    const { mergedProperties, loadedData } = rendererState;
    return lookupDataBoundValue(inputValue, mergedProperties, loadedData);
  }
}
