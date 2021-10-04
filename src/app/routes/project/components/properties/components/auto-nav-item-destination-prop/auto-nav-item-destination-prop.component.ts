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
  selector: 'app-auto-nav-item-destination-prop',
  templateUrl: './auto-nav-item-destination-prop.component.html',
  styleUrls: ['./auto-nav-item-destination-prop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoNavItemDestinationPropComponent {
  @Input() label = 'Destination';
  @Input() inputs?: cd.IAutoNavItemBoard;
  @Input() helpText = '';
  @Input() boards: cd.IBoardProperties[] = [];
  @Input() props: cd.PropertyModel[] = [];
  @Input() parentInputs?: cd.IAutoNavInputs;

  @Output() activeValue = new EventEmitter<string>();
  @Output() selectItem = new EventEmitter<cd.SelectItemOutput>();

  get parentPortalTarget(): string | undefined {
    return this.parentInputs?.target;
  }

  onSelected(selectedBoard: cd.SelectItemOutput) {
    this.selectItem.emit(selectedBoard);
  }

  onActiveValue(value: string) {
    this.activeValue.emit(value);
  }
}
