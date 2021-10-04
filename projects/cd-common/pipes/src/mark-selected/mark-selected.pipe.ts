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
import { ISelectItem } from 'cd-interfaces';

@Pipe({
  name: 'MarkSelection',
})
export class MarkSelection implements PipeTransform {
  /**
   *  Takes an ISelectItem[] array and a selectedValue and marks  ISelectItem[] as selected
   */
  transform(data: ISelectItem[], selectedValue: any, disableValues: string[] = []): ISelectItem[] {
    if (selectedValue === undefined) return data;
    return data.map((item) => {
      const selected = item.value === selectedValue;
      const disabled = !selected && disableValues.includes(item.value);
      return { ...item, selected, disabled };
    });
  }
}
