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
  ChangeDetectorRef,
  ComponentRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { DataPickerComponent } from './data-picker.component';
import { IOverlayConfig, OverlayService } from '../overlay/overlay.service';
import { DataPickerService } from './data-picker.service';
import { half, clamp } from 'cd-utils/numeric';
import { IDataBoundValue, InputValueType } from 'cd-interfaces';
import { Subscription } from 'rxjs';
import { calculateOverlayPosition } from '../overlay/overlay.utils';
import { isDataBoundValue } from 'cd-common/utils';

const PADDING = 8;
const INPUT_HEIGHT = 24;
const OVERLAY_HEIGHT = 128;
const OVERLAY_EXP_WIDTH = 260;
const OVERLAY_EXP_HEIGHT = 380;

@Directive({
  selector: '[cdDataPicker]',
})
export class DataPickerDirective implements OnDestroy {
  private _componentRef?: ComponentRef<DataPickerComponent>;
  private _fallbackValue?: InputValueType;

  @Input() activeElementIds: string[] = [];
  @Output() selectedValueChange = new EventEmitter<IDataBoundValue | undefined>();
  @Output() activeValueChange = new EventEmitter<string>();
  @Output() closePicker = new EventEmitter<void>();
  @Output() openPicker = new EventEmitter<void>();

  constructor(
    private _overlayService: OverlayService,
    private _cdRef: ChangeDetectorRef,
    private _dataService: DataPickerService,
    private _elemRef: ElementRef
  ) {}

  @HostBinding('class.active')
  get pickerActive() {
    return this._componentRef !== undefined;
  }

  cleanupComponentRef() {
    if (!this._componentRef) return;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  get parentNode() {
    return this._elemRef.nativeElement.parentElement;
  }

  getPickerPosition(
    offsetX: number
  ): [x: number, y: number, rightAligned: boolean, expandedDeltaY: number] {
    const { innerWidth, innerHeight } = window;
    const { top, left } = this.parentNode.getBoundingClientRect();
    const rightAligned = left >= half(innerWidth);
    const xp = rightAligned ? left - PADDING + offsetX : left + half(OVERLAY_EXP_WIDTH) - offsetX;
    const yp = Math.round(top - half(OVERLAY_HEIGHT) + half(INPUT_HEIGHT));
    const x = clamp(xp, PADDING, innerWidth);
    const y = clamp(yp, PADDING, innerHeight);
    // Calculate expanded container offsetY position
    const [, minY] = calculateOverlayPosition(OVERLAY_EXP_WIDTH, OVERLAY_HEIGHT, x, y);
    const [, maxY] = calculateOverlayPosition(OVERLAY_EXP_WIDTH, OVERLAY_EXP_HEIGHT, x, y);
    const expandedDeltaY = minY - maxY;
    return [x, y, rightAligned, expandedDeltaY];
  }

  createDataPickerForSingleSource(dataSourceId: string, openEditor = false) {
    this.createDataPicker(undefined, undefined, dataSourceId);
    const { _componentRef } = this;
    if (_componentRef) _componentRef.instance.editing = openEditor;
  }

  createDataPickerWithOffsetX(binding?: IDataBoundValue, offsetX = 0) {
    this.createDataPicker(binding, undefined, undefined, offsetX);
  }

  createDataPicker(
    binding?: IDataBoundValue,
    currentValue?: InputValueType,
    singleDataSourceId?: string,
    offsetX = 0
  ) {
    const isSingleSource = !!singleDataSourceId;
    this._fallbackValue = currentValue;
    const [x, y, alignRight, deltaY] = this.getPickerPosition(offsetX);
    const overlayConfig: IOverlayConfig = { x, y, alignRight, disableAutoClose: true };
    const componentRef = this._overlayService.attachComponent(DataPickerComponent, overlayConfig);
    if (binding) componentRef.instance.initBinding(binding);
    componentRef.instance.rightAligned = alignRight;
    componentRef.instance.expandedDeltaY = -deltaY;
    componentRef.instance.singleDataSource = isSingleSource;
    componentRef.instance.filterElementIds = this.activeElementIds;
    if (isSingleSource) componentRef.instance.currentDataSourceId = singleDataSourceId;
    const subscription = new Subscription();
    const { instance } = componentRef;
    subscription.add(instance.selectedValueChange.subscribe(this.onSelectedValueChange));
    subscription.add(instance.activeValue.subscribe(this.handleActiveValue));
    subscription.add(instance.addDataset.subscribe(this.handleAddDataset));
    componentRef.onDestroy(() => {
      subscription.unsubscribe();
      this.closePicker.emit();
      this._componentRef = undefined;
      this._cdRef.markForCheck();
    });
    this._componentRef = componentRef;
    this.openPicker.emit();
  }

  get fallbackValue() {
    return this._fallbackValue;
  }

  getValue(value: IDataBoundValue | undefined) {
    if (!value) return null;
    return this._dataService.getValue(value);
  }

  handleAddDataset = () => {
    this._overlayService.close();
    this._dataService.openAddDatasetMenu$.next();
  };

  handleActiveValue = (id: string) => {
    this.activeValueChange.emit(id);
  };

  onSelectedValueChange = (item?: IDataBoundValue) => {
    const isValid = isDataBoundValue(item);
    const update = isValid ? item : undefined;
    this.selectedValueChange.emit(update);
  };

  ngOnDestroy(): void {
    this.cleanupComponentRef();
  }
}
