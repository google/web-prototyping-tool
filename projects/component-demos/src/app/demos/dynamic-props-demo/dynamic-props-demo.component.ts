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

@Component({
  selector: 'app-demo-props',
  template: `
    <app-dynamic-properties [properties]="properties" [props]="[testData]"></app-dynamic-properties>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicPropsDemoComponent {
  public testData = {
    projectId: 'n9ecACztKtVHF9YA0K6q',
    id: '5ZeIJrvIkOi3fQXov0jm',
    name: 'Location card',
    actions: [],
    attrs: [],
    childIds: [],
    elementType: 'RRzUgOaSzOgn4nNhzSYP',
    frame: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
    metadata: {},
    rootId: '',
    showPreviewStyles: false,
    state: 'base',
    styles: {
      base: {
        style: {
          display: 'block',
          position: 'relative',
          opacity: 1,
          width: {
            value: 320,
            units: 'px',
          },
          height: {
            value: 150,
            units: 'px',
          },
        },
        overrides: [],
      },
    },
    type: 'Element',
    inputs: {
      hidden: false,
      value: 50,
    },
    isCodeComponentInstance: true,
  };
  public properties = [
    {
      children: [
        {
          defaultValue: 50,
          type: 1,
          inputType: 'range',
          max: 100,
          label: 'Value',
          name: 'value',
          id: 'G4AQrNZExyCxNvvJtBrN',
          min: 0,
          bindingType: 'property',
        },
      ],
    },
  ];

  constructor() {}
}
