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
  ViewChild,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { deepCopy } from 'cd-utils/object';
import { DataChange, DynamicPropsListPickerDirective } from './picker.directive';
import { clamp } from 'cd-utils/numeric';
import { findNewSelectedIndexForListControls } from 'cd-common/utils';
import * as consts from '../../../dynamic-props-modal/dynamic-props-modal.consts';
import * as cd from 'cd-interfaces';
import { generateIDWithLength } from 'cd-utils/guid';

@Component({
  selector: 'app-dynamic-props-list',
  templateUrl: './dynamic-props-list.component.html',
  styleUrls: ['./dynamic-props-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicPropsListComponent {
  public activeIndex = -1;

  @Input() config?: cd.IGenericListConfig;
  @Input() selectedIndex = -1;
  @Input() selectedValue?: cd.PropertyValue;

  // Defines what fields should show in the overlay per item/when adding an item
  @Input() schema: cd.IPropertyGroup[] = [];

  // The list data shown in the properties panel
  @Input() data: consts.IInstanceInputs[] = [];

  @Input() parentMergedProps?: cd.PropertyModel;
  @Input() designSystem!: cd.IDesignSystem;
  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() boards: cd.IBoardProperties[] = [];

  @Output() dataChange = new EventEmitter<consts.IInstanceInputs[]>();
  @Output() selectedIndexChange = new EventEmitter<number>();
  @Output() selectedValueChange = new EventEmitter<cd.PropertyValue>();

  @ViewChild(DynamicPropsListPickerDirective, {
    read: DynamicPropsListPickerDirective,
    static: true,
  })
  picker!: DynamicPropsListPickerDirective;

  trackFn(idx: number) {
    return `item-${idx}`;
  }

  onAddData(newItem: consts.IInstanceInputs) {
    const cloneItem = deepCopy(newItem);
    if (this.config?.supportsMultiAndSingle && !newItem.value) {
      cloneItem.value = generateIDWithLength(7);
    }

    const clone = deepCopy(this.data);
    clone.push(cloneItem);
    this.dataChange.emit(clone);

    if (clone.length === 1) {
      // Just added an item to empty list, set selected index
      this.setSelectedIndex(true, 0);
    }
  }

  onDataChange(event: DataChange) {
    const [update, idx] = event;
    if (idx === undefined) return;
    const { data } = this;
    const clone = deepCopy(data);
    clone[idx] = update;
    this.dataChange.emit(clone);
  }

  onAdd(x: number, y: number) {
    const { schema, config, designSystem, colorMenuData, parentMergedProps, boards } = this;
    this.picker?.createPicker(
      x,
      y,
      schema,
      colorMenuData,
      designSystem,
      boards,
      parentMergedProps,
      config
    );
  }

  onDrop(e: CdkDragDrop<consts.IInstanceInputs[]>) {
    const { previousIndex, currentIndex } = e;
    const dataCopy = deepCopy(this.data);
    moveItemInArray(dataCopy, previousIndex, currentIndex);
    this.dataChange.emit(dataCopy);
    // Cannot wait for this to funnel in because it causes rubberbanding in the UI
    this.data = dataCopy;

    // Move selected index if needed
    const { selectedIndex } = this;
    if (selectedIndex === -1) return;
    const newIndex = findNewSelectedIndexForListControls(
      previousIndex,
      currentIndex,
      selectedIndex
    );
    this._updateSelectedIndex(newIndex);
  }

  setSelected(selected: boolean, i: number) {
    if (!this.config) return;
    const { multiSelect, supportsSelection, supportsMultiAndSingle } = this.config;
    if (!supportsSelection) return;

    if (!multiSelect) return this.setSelectedIndex(selected, i);

    if (supportsMultiAndSingle) return this.setSelectedGroupValues(selected, i);

    const dataCopy = deepCopy(this.data);
    this.data = dataCopy.map((item: consts.IInstanceInputs, idx: number) => {
      const isClickedItem = i === idx;
      const isSelected = isClickedItem ? selected : item.selected;
      return { ...item, selected: isSelected };
    });

    this.dataChange.emit(this.data);
  }

  /** Used for new multiselect *by value* mode */
  setSelectedGroupValues(selected: boolean, i: number) {
    const itemValue = this.data[i].value as string;
    const selectedValues = [...(this.selectedValue as string[])];
    const itemIsInArray = selectedValues.includes(itemValue);

    if (selected && !itemIsInArray) {
      selectedValues.push(itemValue);
      this.selectedValueChange.emit(selectedValues);
    } else if (!selected) {
      const filteredValues = selectedValues.filter((val) => val !== itemValue);
      this.selectedValueChange.emit(filteredValues);
    }
  }

  /**
   * Used for single select *by index* mode
   * TODO: refactor, move away from this
   */
  setSelectedIndex(active: boolean, i: number) {
    if (this.config?.supportsSelection === false) return;
    const selectedIndex = active ? i : -1;
    this.selectedIndexChange.emit(selectedIndex);
    // Cannot wait for this to funnel in because it causes rubberbanding in the UI
    this.selectedIndex = selectedIndex;
  }

  private _updateSelectedIndex(i: number) {
    if (this.config?.selectionIsValue) {
      this.selectedIndex = i;
    } else {
      this.setSelectedIndex(true, i);
    }
  }

  onEdit(e: MouseEvent, item: consts.IInstanceInputs, idx: number) {
    const target = e.currentTarget as HTMLElement;
    const { left: x, top: y } = target.getBoundingClientRect();
    const { schema, config, designSystem, colorMenuData, parentMergedProps, boards } = this;
    this.picker?.createPicker(
      x,
      y,
      schema,
      colorMenuData,
      designSystem,
      boards,
      parentMergedProps,
      config,
      item,
      idx
    );
    this.activeIndex = idx;
  }

  onClearActiveIndex() {
    this.activeIndex = -1;
  }

  onDelete = (idx: number) => {
    // Delete item from array
    const dataCopy = deepCopy(this.data);
    const update = removeValueFromArrayAtIndex(idx, dataCopy);
    this.dataChange.emit(update);

    // Update selected index accordingly if needed
    const len = dataCopy.length - 1;
    if (this.selectedIndex < len) return;
    const updatedIndex = clamp(len - 1, -1, dataCopy.length);
    this._updateSelectedIndex(updatedIndex);
  };
}
