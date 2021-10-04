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
  ComponentRef,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { AbstractPropListDirective } from '../abstract/abstract.proplist';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { GenericPropEditorComponent } from './generic-prop-editor/generic-prop-editor.component';
import { OverlayService } from '../../overlay/overlay.service';
import { deepCopy } from 'cd-utils/object';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { clamp, half } from 'cd-utils/numeric';
import { incrementedName } from 'cd-utils/string';
import { findNewSelectedIndexForListControls } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

const DEFAULT_CONFIG_NAME = 'Option';
const DEFAULT_CONFIG: cd.IGenericListConfig = {
  supportsIcons: true,
  supportsValue: true,
  supportsDisabled: true,
  supportsSelection: true,
  multiSelect: false,
  valueType: cd.GenericListValueType.String,
};

@Component({
  selector: 'cd-generic-prop-list',
  templateUrl: './generic-prop-list.component.html',
  styleUrls: ['./generic-prop-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OverlayService],
})
export class GenericPropListComponent extends AbstractPropListDirective implements OnDestroy {
  private _componentRef?: ComponentRef<GenericPropEditorComponent>;
  private _config: cd.IGenericListConfig = DEFAULT_CONFIG;
  public activeIndex = -1;

  @Input() iconClass?: string;
  @Input() selectedIndex = -1;
  @Input() options: cd.ISelectItem[] = [];
  @Input() data: cd.IGenericConfig[] = [];

  @Input()
  get config(): cd.IGenericListConfig {
    return this._config;
  }
  set config(value: cd.IGenericListConfig) {
    if (!value) return;
    this._config = value;
  }

  @Output() dataChange = new EventEmitter<cd.IGenericConfig[]>();
  @Output() selectedIndexChange = new EventEmitter<number>();

  constructor(private _overlayService: OverlayService, private _cdRef: ChangeDetectorRef) {
    super();
  }

  get mustHaveSelection() {
    return this.config && this.config.mustHaveSelection;
  }

  setSelected(selected: boolean, i: number) {
    const { multiSelect, supportsSelection } = this.config;
    if (!supportsSelection) return;
    if (!multiSelect) return this.setSelectedIndex(selected, i);
    const dataItemCopy = deepCopy(this.data[i]);
    this.data[i] = { ...dataItemCopy, selected };
    this.dataChange.emit(this.data);
  }

  setSelectedIndex(active: boolean, i: number) {
    if (this.config?.supportsSelection === false) return;
    const selectedIndex = active ? i : -1;
    this.selectedIndexChange.emit(selectedIndex);
    // Cannot wait for this to funnel in because it causes rubberbanding in the UI
    this.selectedIndex = selectedIndex;
  }

  cleanupComponentRef() {
    if (this._componentRef) {
      this._overlayService.close();
      this._componentRef = undefined;
    }
  }

  ngOnDestroy() {
    this.cleanupComponentRef();
  }

  onDrop(e: CdkDragDrop<cd.IGenericConfig[]>) {
    const { previousIndex, currentIndex } = e;
    const dataCopy = deepCopy(this.data);
    moveItemInArray(dataCopy, previousIndex, currentIndex);
    this.dataChange.emit(dataCopy);
    this.data = dataCopy;

    const { selectedIndex } = this;
    if (selectedIndex === -1) return;
    const newIndex = findNewSelectedIndexForListControls(
      previousIndex,
      currentIndex,
      selectedIndex
    );
    this._updateSelectedIndex(newIndex);
  }

  generateUsedValues(data: cd.IGenericConfig[], idx = -1): string[] {
    return data.reduce<string[]>((acc, curr, i) => {
      if (i !== idx && curr.value !== undefined) {
        acc.push(curr.value);
      }
      return acc;
    }, []);
  }

  private _updateSelectedIndex(i: number) {
    if (this.config?.selectionIsValue) {
      this.selectedIndex = i;
    } else {
      this.setSelectedIndex(true, i);
    }
  }

  onDelete = (idx: number) => {
    const dataCopy = deepCopy(this.data);
    const update = removeValueFromArrayAtIndex(idx, dataCopy);
    this.dataChange.emit(update);
    this.data = dataCopy;

    const len = dataCopy.length - 1;
    if (this.selectedIndex < len) return;
    const updatedIndex = clamp(len - 1, -1, dataCopy.length);
    this._updateSelectedIndex(updatedIndex);
  };

  onEdit(e: MouseEvent, item: cd.IGenericConfig, idx: number) {
    const target = e.currentTarget as HTMLElement;
    const OFFSET_X = -306;
    const OFFSET_Y = this.determineOffsetFromConfig(this.config);
    const { left: x, top: y } = target.getBoundingClientRect();
    const componentRef = this.createEditor(x + OFFSET_X, y + OFFSET_Y, idx);

    componentRef.instance.data = item;
    this.activeIndex = idx;
    const subscription = componentRef.instance.dataChange.subscribe((update: cd.IGenericConfig) => {
      const { data } = this;
      const clone = deepCopy(data);
      clone[idx] = update;
      this.dataChange.emit(clone);
      this.data = clone;
    });

    componentRef.onDestroy(() => {
      this.activeIndex = -1;
      this._cdRef.markForCheck();
      subscription.unsubscribe();
    });

    this._componentRef = componentRef;
  }

  getNextAvailableOptionForSelection(): string {
    const { options, data } = this;
    const selectUnused = this.generateUsedValues(data);
    const found = options.find((item) => !selectUnused.includes(item.value));
    return found ? found.value : '';
  }

  generateDefaultForNewProp(): cd.IGenericConfig {
    const canSelect = this.config.supportsSelection;
    const value = canSelect ? this.getNextAvailableOptionForSelection() : '';
    const names = this.data.map((item) => item.name);
    const baseName = this.config.defaultName || DEFAULT_CONFIG_NAME;
    const config = { name: incrementedName(baseName, names), value };
    return config;
  }

  createEditor(x: number, y: number, idx = -1) {
    const componentRef = this._overlayService.attachComponent(GenericPropEditorComponent, { x, y });
    componentRef.instance.usedValues = this.generateUsedValues(this.data, idx);
    componentRef.instance.options = this.options;
    componentRef.instance.iconClass = this.iconClass;

    if (this.config) {
      componentRef.instance.config = this.config;
    }

    return componentRef;
  }

  determineOffsetFromConfig(config: cd.IGenericListConfig) {
    const INPUT_HEIGHT = 24;
    const PADDING = 16;
    let height = INPUT_HEIGHT * 2;
    if (config.supportsDisabled) height += INPUT_HEIGHT;
    if (config.supportsIcons) height += INPUT_HEIGHT;
    return -half(height + PADDING * 2);
  }

  onAdd(x: number, y: number) {
    const OFFSET = -70;
    const OFFSET_Y = this.determineOffsetFromConfig(this.config) + OFFSET;
    const componentRef = this.createEditor(x + OFFSET, y + OFFSET_Y);
    componentRef.instance.add = true;
    componentRef.instance.data = this.generateDefaultForNewProp();
    const subscription = componentRef.instance.addData.subscribe((_update: cd.IGenericConfig) => {
      const { data } = this;
      const clone = deepCopy(data);
      if (clone.length === 0) {
        _update.selected = true;
      }
      clone.push(_update);
      this.dataChange.emit(clone);
      this._overlayService.close();
    });

    componentRef.onDestroy(() => subscription.unsubscribe());

    this._componentRef = componentRef;
  }
}
