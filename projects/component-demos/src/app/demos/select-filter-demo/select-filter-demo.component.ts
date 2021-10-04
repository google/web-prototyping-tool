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
import { ISelectItem } from 'cd-interfaces';

@Component({
  selector: 'app-select-filter-demo',
  template: `
    <div class="container">
      <cd-input-group label="Small data, no filter">
        <cd-select-input [data]="menuData"></cd-select-input>
      </cd-input-group>
      <cd-input-group label="Long data">
        <cd-select-input
          [data]="longMenu"
          outline
          [helpText]="{
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation',
            link: '//google.com',
            linkText: 'Learn more'
          }"
        ></cd-select-input>
      </cd-input-group>
      <cd-input-group label="No data, no menu">
        <cd-select-input [data]="[]" placeholder="no data test"></cd-select-input>
      </cd-input-group>
      <cd-input-group label="Various options">
        <cd-select-input [data]="foo" resetState="None"></cd-select-input>
      </cd-input-group>
      <cd-input-group label="no filter + reset">
        <cd-select-input
          [data]="menuData"
          resetState="None"
          [helpText]="{
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation',
            link: '//google.com',
            linkText: 'Learn more'
          }"
        ></cd-select-input>
      </cd-input-group>
      <cd-input-group label="test">
        <cd-input
          [data]="menuData"
          resetState="None"
          [helpText]="{
            text: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui',
            link: '//google.com',
            linkText: 'Learn more'
          }"
        ></cd-input>
      </cd-input-group>
      <cd-input-group label="Subtitle tooltips">
        <cd-select-input [data]="menuDataSubtitles" resetState="None"></cd-select-input>
      </cd-input-group>

      <cd-select-button [data]="foo" (selected)="onSelectButtonSelect($event)"></cd-select-button>
    </div>
  `,
  styles: [
    `
      .container {
        width: 400px;
        display: grid;
        gap: 10px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectFilterDemoComponent {
  menuData = [
    { title: 'foo', value: 'foo' },
    { title: 'bar', value: 'bar' },
    { title: 'baz', value: 'baz' },
  ];

  menuDataSubtitles = [
    { title: 'foo', value: 'foo', subtitle: 'lorem' },
    { title: 'bar', value: 'bar', subtitle: 'ipsum' },
    { title: 'baz', value: 'baz', subtitle: 'dolor' },
  ];

  foo = [
    { title: 'Android', value: 'android', type: 'icon', inlineIcon: true, selected: true },
    { title: 'Foo', value: 'test', type: 'check' },
    { title: 'Primary', value: '#2196F3', type: 'color' },
    { title: 'PrimaryLight', value: '#96cdf9', type: 'color', disabled: true },
    { title: 'Secondary', value: '#f95d92', type: 'color' },
    { title: 'Indigo', value: '#3f51b5', type: 'color' },
    { title: 'Teal', value: '#1de9b6', type: 'color', divider: true },
    { title: 'Lorem', value: '#1de9b6', type: 'color' },
    { title: 'Ipsum', value: '#1de9b6', type: 'color', divider: true },
    { title: 'Dolor ipsum dolor...', action: true },
  ];

  longMenu = Array.from({ length: 100 }, (_itm, i) => {
    const item = `item ${i}`;
    return { title: item, value: item };
  });

  onSelectButtonSelect(item: ISelectItem) {
    console.log('selected', item);
  }
}
