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
  ChangeDetectorRef,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { sizeMenuConfig } from 'cd-common/consts';
import * as cd from 'cd-interfaces';

const createPadding = (top = 0, left = 0, right = 0, bottom = 0): cd.IEdgeStyle => {
  return { top, left, bottom, right };
};

@Component({
  selector: 'cd-edge-props',
  templateUrl: './edge-props.component.html',
  styleUrls: ['./edge-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgePropsComponent {
  private _hideBottomLabel = false;
  private _model: cd.IEdgeStyle = createPadding();
  private _checkForExpand = false;
  private _id = '';
  public allValuesEqual = true;
  public advanced = false;
  public sliderValue: string | number = 0;
  public placeholderValue = '';

  @Input()
  set id(id: string) {
    const didChange = id !== this._id;
    if (!didChange) return;
    this._id = id;
    this._checkForExpand = true;
  }

  @Input() autocompleteMenu: cd.ISelectItem[] = sizeMenuConfig;
  @Input() min = Number.MIN_SAFE_INTEGER;
  @Input() max = 100;
  @Input() propTitle = '';
  @Input() edgeLabels: cd.IEdgeItem[] = [
    { label: 'T', tooltip: 'Top' },
    { label: 'R', tooltip: 'Right' },
    { label: 'B', tooltip: 'Bottom' },
    { label: 'L', tooltip: 'Left' },
  ];

  @Input()
  set hideBottomLabel(value) {
    this._hideBottomLabel = coerceBooleanProperty(value);
  }
  get hideBottomLabel() {
    return this._hideBottomLabel;
  }

  @Input()
  set model(value: cd.IEdgeStyle) {
    this._model = value ? { ...value } : createPadding();
    this.updateSliderValue(this._model);
    this.checkForExpand();
  }
  get model(): cd.IEdgeStyle {
    return this._model;
  }

  @Output() modelChange = new EventEmitter<cd.IEdgeStyle>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  checkForExpand() {
    if (!this._checkForExpand) return;
    this.advanced = !this.allObjAttribesAreEqual(this._model);
    this._checkForExpand = false;
  }

  allObjAttribesAreEqual(model: cd.IEdgeStyle): boolean {
    return Object.values(model).every((value, idx, arr) =>
      idx === 0 ? true : value === arr[idx - 1]
    );
  }

  generatePlaceholder(model: cd.IEdgeStyle): string {
    if (this.allValuesEqual) return '';
    // Specific order based on css values
    return [model.top, model.right, model.bottom, model.left].toString();
  }

  updateSliderValue(model: cd.IEdgeStyle) {
    this.allValuesEqual = this.allObjAttribesAreEqual(model);
    this.sliderValue = this.allValuesEqual ? model.left : '';
    this.placeholderValue = this.generatePlaceholder(model);
  }

  onModelChange(value: number, idx: number) {
    const clone = { ...this.model };
    if (idx === 0) clone.top = value;
    if (idx === 1) clone.right = value;
    if (idx === 2) clone.bottom = value;
    if (idx === 3) clone.left = value;
    this.modelChange.emit(clone);
  }

  onSliderchange(value: number) {
    const values = new Array(4).fill(value);
    const groupValue = createPadding(...values);
    this.modelChange.emit({ ...groupValue });
  }

  onModeToggle() {
    this.advanced = !this.advanced;
    this._cdRef.markForCheck();
  }

  onValueChange(item: cd.ISelectItem | string | number | undefined, idx: number) {
    const value = (item as cd.ISelectItem)?.value ?? item;
    this.onModelChange(Number(value), idx);
  }
}
