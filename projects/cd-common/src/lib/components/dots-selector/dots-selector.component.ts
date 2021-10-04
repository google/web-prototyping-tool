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

import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { ISelectItem } from 'cd-interfaces';
import { closestChildIndexForEvent } from 'cd-common/utils';
import { LIST_ITEM_TAG } from 'cd-common/consts';

@Component({
  selector: 'cd-dots-selector',
  templateUrl: './dots-selector.component.html',
  styleUrls: ['./dots-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DotsSelectorComponent {
  /** Order matters when setting the position here */
  @Input() data: ISelectItem[] = [];
  @Output() selectDot = new EventEmitter<ISelectItem>();

  constructor() {}

  onClick(e: MouseEvent) {
    const targetIndex = closestChildIndexForEvent(e, LIST_ITEM_TAG);
    if (targetIndex === -1) return;
    const item = this.data[targetIndex];
    this.selectDot.emit(item);
  }

  trackByfn(_index: number, item: ISelectItem) {
    return item.value;
  }
}
