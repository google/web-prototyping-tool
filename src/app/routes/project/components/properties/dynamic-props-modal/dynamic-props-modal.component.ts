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
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { OverlayInitService } from 'cd-common';
import * as consts from './dynamic-props-modal.consts';
import * as cd from 'cd-interfaces';

// TODO: DRY up
interface IInstanceInputs extends cd.IBaseElementInputs {
  [key: string]: cd.PropertyValue;
}

@Component({
  selector: 'app-dynamic-props-modal',
  templateUrl: './dynamic-props-modal.component.html',
  styleUrls: ['./dynamic-props-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicPropsModalComponent implements AfterViewInit {
  private _data: IInstanceInputs = {};
  public properties: cd.IPropertyGroup[] = [];
  public propertyModels: cd.PropertyModel[] = [];

  @Input() add = false;
  @Input() config?: cd.IGenericListConfig;
  @Input() boards: cd.IBoardProperties[] = [];
  @Input() parentMergedProps?: cd.PropertyModel;
  @Input() designSystem!: cd.IDesignSystem;
  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];

  @Input()
  set data(value: IInstanceInputs) {
    this._data = value;
    this._generatePropertyModels();
  }
  get data(): IInstanceInputs {
    return this._data;
  }

  // Defines what fields should show in the overlay per item/when adding an item
  @Input() set schema(value: cd.IPropertyGroup[]) {
    this.properties = value;
  }

  @Output() dataChange = new EventEmitter<IInstanceInputs>();
  @Output() addData = new EventEmitter<IInstanceInputs>();

  constructor(private _overlayInit: OverlayInitService) {}

  get addButtonLabel() {
    return this.config?.addButtonLabel || consts.DEFAULT_ADD_BUTTON_LABEL;
  }
  ngAfterViewInit(): void {
    this._overlayInit.componentLoaded();
  }

  private _generatePropertyModels() {
    const rootId = this.parentMergedProps?.rootId || '';
    const adjustedModel = { ...consts.MODEL, rootId, inputs: this.data };
    this.propertyModels = [adjustedModel];
  }

  updateData(value: Partial<IInstanceInputs>) {
    const update = { ...this.data, ...value };
    this.dataChange.emit(update);
    this.data = update;
  }

  onAdd() {
    this.addData.emit(this.data);
  }

  onPropsChange(change: Partial<cd.PropertyModel>) {
    const { inputs } = change;
    this.updateData(inputs as IInstanceInputs);
  }
}
