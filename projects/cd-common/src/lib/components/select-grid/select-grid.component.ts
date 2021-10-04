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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  QueryList,
  ViewChildren,
  HostListener,
} from '@angular/core';
import { ISelectItem } from 'cd-interfaces';
import { ToggleButtonDirective } from '../button/toggle-button.directive';
import { closestChildIndexForEvent } from 'cd-common/utils';

@Component({
  selector: 'cd-select-grid',
  templateUrl: './select-grid.component.html',
  styleUrls: ['./select-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectGridComponent {
  public selectedIndex = 0;
  private _data: ISelectItem[] = [];

  @Input()
  get data(): ISelectItem[] {
    return this._data;
  }
  set data(value: ISelectItem[]) {
    this._data = value;
    const idx = value.findIndex((item) => item.selected);
    // Select grid should always have at least one item selected
    this.selectedIndex = idx === -1 ? 0 : idx;
  }

  @Output() dataChange = new EventEmitter<ISelectItem[]>();
  @Output() selectItem = new EventEmitter<ISelectItem>();

  @ViewChildren(ToggleButtonDirective) toggleButtons!: QueryList<ToggleButtonDirective>;

  @HostListener('click', ['$event'])
  onClick(e: MouseEvent) {
    const index = closestChildIndexForEvent(e, 'button');
    this.onSelect(index);
  }

  onSelect(idx: number) {
    if (this.selectedIndex === idx || idx === -1) return;
    this.selectedIndex = idx;
    const item = this.data[idx];
    this.selectItem.emit(item);

    const clone = this.data.reduce<ISelectItem[]>((acc, curr, i) => {
      const { selected, ...values } = curr;
      const cloneItem = { ...values } as ISelectItem;
      if (i === idx) {
        cloneItem.selected = true;
      }
      acc.push(cloneItem);
      return acc;
    }, []);

    this.dataChange.emit(clone);
  }

  triggerComponentFocus() {
    this.toggleButtons.first.triggerFocus();
  }
}
