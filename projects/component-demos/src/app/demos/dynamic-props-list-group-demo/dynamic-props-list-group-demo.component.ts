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

import { Component, ChangeDetectionStrategy } from '@angular/core';
import * as cd from 'cd-interfaces';

const TEST_SCHEMA: cd.IPropertyGroup[] = [
  {
    defaultValue: 'Option #',
    inputType: cd.PropertyInput.Text,
    label: 'Name',
    name: 'name',
    type: cd.PropertyType.AttributeGeneric,
  },
  {
    defaultValue: '1',
    inputType: cd.PropertyInput.Text,
    label: 'Value',
    name: 'value',
    type: cd.PropertyType.AttributeGeneric,
  },
];

const TEST_DATA = [
  { name: 'Option 1', value: '1' },
  { name: 'Option 2', value: '2' },
  { name: 'Option 3', value: '3' },
];

@Component({
  selector: 'app-dynamic-props-list-group-demo',
  templateUrl: './dynamic-props-list-group-demo.component.html',
  styleUrls: ['./dynamic-props-list-group-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicPropsListGroupDemoComponent {
  public testSchema = TEST_SCHEMA;
  public data = TEST_DATA;

  onDataChange(data: any) {
    this.data = data;
  }
}
