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
import { IPropertyGroup, ISelectItem } from 'cd-interfaces';

@Pipe({
  name: 'PropertiesToMenuItemsPipe',
})
export class PropertiesToMenuItems implements PipeTransform {
  /**
   * Takes an IPropertyGroup[] array and returns array of ISelectItem[] where:
   * The ISelectItem value is set to the property name
   * The ISelectItem title is set to the property label
   */
  transform(data: IPropertyGroup[] = []): ISelectItem[] {
    return data.reduce<ISelectItem[]>((acc, curr) => {
      const { name, label } = curr;
      if (!name) return acc;
      const title = label || name;
      const selectItem: ISelectItem = { title, value: name };
      acc.push(selectItem);
      return acc;
    }, []);
  }
}
