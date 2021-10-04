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

/// <reference types="resize-observer-browser" />

import {
  Directive,
  OnDestroy,
  Output,
  EventEmitter,
  ComponentRef,
  ChangeDetectorRef,
  Input,
} from '@angular/core';
import { OverlayService } from 'cd-common';
import { DynamicPropsModalComponent } from '../../../dynamic-props-modal/dynamic-props-modal.component';
import * as consts from '../../../dynamic-props-modal/dynamic-props-modal.consts';
import * as cd from 'cd-interfaces';
import { half } from 'cd-utils/numeric';

export type DataChange = [update: consts.IInstanceInputs, idx?: number];
type OverlayPosition = [x: number, y: number];

@Directive({
  selector: '[appDynamicPropsListPicker]',
  providers: [OverlayService],
})
export class DynamicPropsListPickerDirective implements OnDestroy {
  private _componentRef?: ComponentRef<DynamicPropsModalComponent>;
  private _resizeObserver: ResizeObserver;
  private _currentX?: number;
  private _currentY?: number;
  private _adding?: boolean;

  @Input() config?: cd.IGenericListConfig;

  @Output() addData = new EventEmitter<consts.IInstanceInputs>();
  @Output() dataChange = new EventEmitter<DataChange>();
  @Output() clearActiveIndex = new EventEmitter<void>();

  constructor(private _overlayService: OverlayService, private _cdRef: ChangeDetectorRef) {
    this._resizeObserver = new ResizeObserver(this.onOverlayResize);
  }

  private _generateNewItem(schema: cd.IPropertyGroup[]): consts.IInstanceInputs {
    return schema.reduce<consts.IInstanceInputs>((acc, curr) => {
      const { inputName, name, defaultValue, children } = curr;
      const key = inputName || name;
      if (key && defaultValue !== undefined) acc[key] = defaultValue;
      if (children?.length) acc = { ...acc, ...this._generateNewItem(children) };
      return acc;
    }, {});
  }

  private _getYOffset() {
    const height = consts.INPUT_HEIGHT * 2;
    const padding = consts.EXTRA_PADDING * 2;
    return -half(height + padding);
  }

  private _createOverlay(
    x: number,
    y: number,
    schema: cd.IPropertyGroup[],
    colorMenuData: ReadonlyArray<cd.ISelectItem>,
    designSystem: cd.IDesignSystem,
    boards: cd.IBoardProperties[],
    parentMergedProps?: cd.PropertyModel,
    config?: cd.IGenericListConfig
  ) {
    const ref = this._overlayService.attachComponent(DynamicPropsModalComponent, { x, y });
    ref.instance.schema = schema;
    ref.instance.config = config;
    ref.instance.designSystem = designSystem;
    ref.instance.colorMenuData = colorMenuData;
    ref.instance.boards = boards;
    ref.instance.parentMergedProps = parentMergedProps;

    // attach resize observer to recalculate overaly position if dimensions change
    this._resizeObserver.observe(ref.location.nativeElement);

    return ref;
  }

  private _getOverlayPosition(x: number, y: number, add = false): OverlayPosition {
    const xModifier = add ? consts.ADD_X_OFFSET : consts.EDIT_X_OFFSET;
    const overlayX = x + xModifier;
    const yModifier = add ? consts.ADD_X_OFFSET : 0;
    const overlayY = y + this._getYOffset() + yModifier;
    return [overlayX, overlayY];
  }

  createPicker(
    x: number,
    y: number,
    schema: cd.IPropertyGroup[],
    colorMenuData: ReadonlyArray<cd.ISelectItem>,
    designSystem: cd.IDesignSystem,
    boards: cd.IBoardProperties[],
    parentMergedProps?: cd.PropertyModel,
    config?: cd.IGenericListConfig,
    item?: consts.IInstanceInputs,
    idx?: number
  ) {
    // store x, y, adding, so we can recompute overlay position on resize
    this._currentX = x;
    this._currentY = y;
    this._adding = !item;

    const [overlayX, overlayY] = this._getOverlayPosition(x, y, !item);
    const componentRef = this._createOverlay(
      overlayX,
      overlayY,
      schema,
      colorMenuData,
      designSystem,
      boards,
      parentMergedProps,
      config
    );

    componentRef.instance.add = !item;
    componentRef.instance.data = item ? item : this._generateNewItem(schema);

    const subscription$ = item
      ? componentRef.instance.dataChange.subscribe((update: consts.IInstanceInputs) => {
          this.dataChange.emit([update, idx]);
        })
      : componentRef.instance.addData.subscribe(this.onAddData);

    componentRef.onDestroy(() => {
      this.clearActiveIndex.emit();
      this._cdRef.markForCheck();
      subscription$.unsubscribe();
    });

    this._componentRef = componentRef;
  }

  onOverlayResize = () => {
    const { _currentX, _currentY, _adding } = this;
    if (_currentX === undefined || _currentY === undefined || _adding === undefined) return;
    const [x, y] = this._getOverlayPosition(_currentX, _currentY, _adding);
    this._overlayService.updateConfig({ x, y });
  };

  onAddData = (newItem: consts.IInstanceInputs) => {
    this.addData.emit(newItem);
    this.cleanupComponentRef();
  };

  cleanupComponentRef() {
    this._resizeObserver.disconnect();
    if (!this._componentRef) return;
    this._currentX = undefined;
    this._currentY = undefined;
    this._adding = undefined;
    this._overlayService.close();
    this._componentRef = undefined;
  }

  ngOnDestroy(): void {
    this.cleanupComponentRef();
  }
}
