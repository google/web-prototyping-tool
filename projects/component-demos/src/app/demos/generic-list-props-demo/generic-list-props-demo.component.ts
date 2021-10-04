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
import { MATERIAL_ICONS_CLASS } from 'cd-common/consts';
import * as cd from 'cd-interfaces';

const TEST_DATA = [
  { name: "Philosopher's Stone", value: 'book-1' },
  { name: 'Chamber of Secrets', value: 'book-2' },
  { name: 'Goblet of Fire', value: 'book-3' },
  { name: 'Order of the Phoenix', value: 'book-4' },
  { name: 'Half-Blood Prince', value: 'book-5' },
  { name: 'Deathly Hallows – Part 1', value: 'book-6' },
  { name: 'Deathly Hallows – Part 2', value: 'book-7' },
];

const TEST_CONFIG: cd.IGenericListConfig = {
  valueType: cd.GenericListValueType.String,
  supportsIcons: false,
  supportsDisabled: false,
  supportsSelection: false,
};

const TEST_OPTIONS = [
  { title: 'Home', value: 'home-board-id', icon: '/assets/icons/start-active.svg' },
  { title: 'Learn', value: 'learn-board-id' },
  { title: 'About', value: 'about-board-id' },
  { title: 'Extras', value: 'extra-board-id' },
];

@Component({
  selector: 'app-generic-props-group-demo',
  templateUrl: './generic-list-props-demo.component.html',
  styleUrls: ['./generic-list-props-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericListPropsDemoComponent {
  public selectedIndex = -1;
  public iconClass = MATERIAL_ICONS_CLASS;
  public data: cd.IGenericConfig[] = TEST_DATA;
  public config: Partial<cd.IGenericListConfig> = TEST_CONFIG;
  public options: cd.ISelectItem[] = TEST_OPTIONS;

  onSelectedIndexChange(index: number) {
    this.selectedIndex = index;
  }

  onDataChange(value: cd.IGenericConfig[]) {
    this.data = value;
  }
}
