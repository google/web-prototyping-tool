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
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-portal-list-props',
  templateUrl: './portal-list-props.component.html',
  styleUrls: ['./portal-list-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalListPropsComponent {
  @Input() prop?: cd.IPropertyGroup;
  @Input() data: cd.IGenericConfig[] = [];
  @Input() options: cd.ISelectItem[] = [];

  @Input() selectedIndex?: number;
  @Input() iconClass?: string;

  @Output() dataChange = new EventEmitter<cd.IGenericConfig[]>();
  @Output() selectedIndexChange = new EventEmitter<{ selectedIndex: number }>();

  onChildPortalsChange(childPortals: cd.IGenericConfig[]) {
    this.dataChange.emit(childPortals);
  }

  onSelectedTabChange(selectedIndex: number) {
    this.selectedIndexChange.emit({ selectedIndex });
  }
}