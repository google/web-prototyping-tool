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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ComponentLibrary } from 'cd-interfaces';
import { IComponentFilter } from './component.filter.config';

@Component({
  selector: 'app-component-filter',
  templateUrl: './component-filter.component.html',
  styleUrls: ['./component-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentFilterComponent {
  @Input() filters: ReadonlyArray<IComponentFilter> = [];
  @Input() active: ComponentLibrary = ComponentLibrary.All;
  @Output() activeChange = new EventEmitter<ComponentLibrary>();

  onFilterClick(value: ComponentLibrary) {
    if (this.active === value) return;
    this.activeChange.emit(value);
  }
}
