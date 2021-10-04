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
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import * as cd from 'cd-interfaces';

const CHECKBOX_TOAST_ID = 'cbtoast';

@Component({
  selector: 'app-checkbox-list',
  templateUrl: './checkbox-list.component.html',
  styleUrls: ['./checkbox-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxListComponent {
  private _data: string[] = [];
  private _options: cd.ISelectItem[] = [];
  private _availableIds: string[] = [];

  public activeCheckboxes: string[] = [];

  @Input() prop: cd.IPropertyGroup = {};

  @Input()
  set options(value: cd.ISelectItem[]) {
    this._options = value || [];
    this._availableIds = this._options.map((item) => item.value);
    this.updateAvailableData();
  }
  get options(): cd.ISelectItem[] {
    return this._options;
  }

  @Input()
  set data(value: string[]) {
    this._data = value || [];
    this.updateAvailableData();
  }
  get data(): string[] {
    return this._data;
  }

  @Output() dataChange = new EventEmitter<string[]>();
  @Output() activeValue = new EventEmitter<string>();

  constructor(private _toastService: ToastsService) {}

  updateAvailableData() {
    const { _availableIds } = this;
    // Hide checkboxes which have been deleted
    this.activeCheckboxes = this._data.filter((id) => _availableIds.includes(id));
  }

  showNoAvailableToast() {
    this._toastService.addToast({
      id: CHECKBOX_TOAST_ID,
      iconName: 'info',
      message: 'No available checkboxes to add',
    });
  }

  onAddItem() {
    const { activeCheckboxes, options } = this;
    const unusedCheckbox = options.find((item) => !activeCheckboxes.includes(item.value));
    if (!unusedCheckbox) return this.showNoAvailableToast();

    const update = [...activeCheckboxes];
    update.push(unusedCheckbox.value);
    this.dataChange.emit(update);
  }

  onActiveValue(value: string) {
    this.activeValue.emit(value);
  }

  clearHoverValue() {
    this.activeValue.emit('');
  }

  onHover(idx: number) {
    const value = this.activeCheckboxes[idx] ?? '';
    this.activeValue.emit(value);
  }

  onDelete(idx: number) {
    const update = removeValueFromArrayAtIndex(idx, this.activeCheckboxes);
    this.dataChange.emit(update);
  }

  onCheckboxSelected(item: cd.SelectItemOutput, i: number) {
    const { value } = item as cd.ISelectItem;
    const clone = [...this.activeCheckboxes];
    clone[i] = value;
    this.dataChange.emit(clone);
  }

  trackFn(idx: number, item: cd.IGenericConfig) {
    return `${idx}${item?.value}`;
  }
}
