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
  ElementRef,
  ViewChild,
  OnChanges,
} from '@angular/core';
import { DynamicPropsListComponent } from './dynamic-props-list/dynamic-props-list.component';
import * as consts from '../../dynamic-props-modal/dynamic-props-modal.consts';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-dynamic-props-list-group',
  templateUrl: './dynamic-props-list-group.component.html',
  styleUrls: ['./dynamic-props-list-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicPropsListGroupComponent implements OnChanges {
  @Input() label = '';
  @Input() config?: cd.IGenericListConfig;

  // Defines what fields should show in the overlay per item/when adding an item
  @Input() schema: cd.IPropertyGroup[] = [];
  @Input() boards: cd.IBoardProperties[] = [];

  // The list data shown in the properties panel
  @Input() data: consts.IInstanceInputs[] = [];

  @Input() parentMergedProps?: cd.PropertyModel;
  @Input() designSystem!: cd.IDesignSystem;
  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() selectedIndex = -1;
  @Input() selectedValue?: cd.PropertyValue;

  @Output() dataChange = new EventEmitter<consts.IInstanceInputs[]>();
  @Output() selectedIndexChange = new EventEmitter<number>();
  @Output() selectedValueChange = new EventEmitter<cd.PropertyValue>();

  @ViewChild('propsListRef', { static: true }) _propListRef!: DynamicPropsListComponent;

  constructor(private _elementRef: ElementRef) {}

  ngOnChanges() {
    const { selectedValue, config } = this;
    if (!selectedValue || !config?.selectionIsValue) return;

    if (!config?.multiSelect)
      this.selectedIndex = this.data.findIndex((item) => item.value === selectedValue);
  }

  onAddItem() {
    const { left: x, top: y } = this._elementRef.nativeElement.getBoundingClientRect();
    this._propListRef.onAdd(x, y);
  }

  onDataChange(data: consts.IInstanceInputs[]) {
    this.dataChange.emit(data);
  }

  onSelectedValueChange(value: cd.PropertyValue) {
    this.selectedValueChange.emit(value);
  }

  onSelectedIndexChange(idx: number) {
    if (this.config?.selectionIsValue) {
      const value = idx !== -1 ? this.data[idx]?.value : undefined;
      return this.selectedValueChange.emit(value);
    }
    this.selectedIndexChange.emit(idx);
  }
}
