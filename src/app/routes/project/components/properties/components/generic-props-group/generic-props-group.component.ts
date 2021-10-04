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
  EventEmitter,
  Output,
  ViewChild,
  ElementRef,
  OnChanges,
} from '@angular/core';
import {
  IGenericConfig,
  ISelectItem,
  IGenericListConfig,
  GenericListValueType,
} from 'cd-interfaces';
import { GenericPropListComponent } from 'cd-common';
import { generateIDWithLength } from 'cd-utils/guid';
import { deepCopy } from 'cd-utils/object';

@Component({
  selector: 'app-generic-props-group',
  templateUrl: './generic-props-group.component.html',
  styleUrls: ['./generic-props-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericPropsGroupComponent implements OnChanges {
  private _data: IGenericConfig[] = [];

  @Input() label = '';
  @Input() valueType = GenericListValueType.String;
  @Input() menu: ISelectItem[] = [];
  @Input() config?: IGenericListConfig;
  @Input() iconClass?: string;
  @Input() selectedIndex = -1;
  @Input() options: ISelectItem[] = [];
  @Input() selectedValue?: string | number;

  @Input()
  set data(value: IGenericConfig[]) {
    this._data = value ? deepCopy(value) : [];
  }
  get data(): IGenericConfig[] {
    return this._data;
  }

  @Output() selectedIndexChange = new EventEmitter<number>();
  @Output() selectedValueChange = new EventEmitter<string | number | undefined>();
  @Output() dataChange = new EventEmitter<IGenericConfig[]>();

  @ViewChild('propListRef', { static: true }) _propListRef!: GenericPropListComponent;

  constructor(private _elementRef: ElementRef) {}

  ngOnChanges() {
    const { selectedValue, config } = this;
    if (!selectedValue || !config?.selectionIsValue) return;
    this.selectedIndex = this.data.findIndex((item) => item.value === selectedValue);
  }

  onAddItem() {
    const { left: x, top: y } = this._elementRef.nativeElement.getBoundingClientRect();
    this._propListRef.onAdd(x, y);
  }

  onSelectedIndexChange(idx: number) {
    if (this.config?.selectionIsValue) {
      const value = idx !== -1 ? this.data[idx]?.value : undefined;
      return this.selectedValueChange.emit(value);
    }
    this.selectedIndexChange.emit(idx);
  }

  updateData(data: IGenericConfig[]) {
    const doesntSupportValue = !this.config?.supportsValue;
    const names = new Set();
    const update = [...data].map((item) => {
      // Automatically add a value if one doesnt exist
      const hasName = names.has(item.value);
      names.add(item.value);
      if (doesntSupportValue && (item.value === '' || hasName)) {
        item.value = generateIDWithLength(7);
      }
      return item;
    });

    this.dataChange.emit(update);
    // Need this assignment when trying to also set selectedIndex at near same time
    // For example, when radio buttons are empty and you add one, both trigger and the
    // timing is rough
    this.data = update;
  }
}
