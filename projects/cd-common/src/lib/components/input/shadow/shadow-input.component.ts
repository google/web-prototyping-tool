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
  Input,
  ChangeDetectionStrategy,
  ElementRef,
  HostBinding,
  ViewChild,
} from '@angular/core';
import { HSVColor } from 'cd-utils/color';
import { InputCollectionDirective } from '../abstract/abstract.input.collection';
import { ISelectItem, IShadowStyle } from 'cd-interfaces';
import { DEFAULT_UNITS } from 'cd-common/consts';
import { ColorPickerDirective } from '../color/picker.directive';

const enum ShadowLabel {
  OffsetX = 'x',
  OffsetY = 'y',
  Blur = 'b',
  Spread = 's',
}

@Component({
  selector: 'cd-shadow-input',
  templateUrl: './shadow-input.component.html',
  styleUrls: ['./shadow-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadowInputComponent extends InputCollectionDirective {
  private _textShadow = false;
  protected _value!: IShadowStyle;
  innerLabel = '';

  @Input()
  @HostBinding('class.text-shadow')
  set textShadow(value) {
    this._textShadow = value;
    this.innerLabel = value ? DEFAULT_UNITS : '';
  }
  get textShadow() {
    return this._textShadow;
  }

  @Input() colorData: ISelectItem[] = [];

  @Input()
  get value(): IShadowStyle {
    return this._value;
  }
  set value(value: IShadowStyle) {
    this._value = value;
  }

  @ViewChild(ColorPickerDirective, { read: ColorPickerDirective }) picker?: ColorPickerDirective;

  constructor(protected _elemRef: ElementRef) {
    super(_elemRef);
  }

  get colorValue(): string | undefined {
    return String(this.value?.color?.value);
  }

  get offsetXLabel(): string | undefined {
    return this.showBottomLabel ? ShadowLabel.OffsetX : undefined;
  }

  get offsetYLabel(): string | undefined {
    return this.showBottomLabel ? ShadowLabel.OffsetY : undefined;
  }

  get blurLabel(): string | undefined {
    return this.showBottomLabel ? ShadowLabel.Blur : undefined;
  }

  get spreadLabel(): string | undefined {
    return this.showBottomLabel ? ShadowLabel.Spread : undefined;
  }

  writeValue(value: Partial<IShadowStyle>) {
    const update = { ...this.value, ...value };
    this.valueChange.emit(update);
  }

  onColorPick = ({ rgbaString }: HSVColor): void => {
    const update = { color: { value: rgbaString } };
    this.writeValue(update);
  };

  onOffsetXChange(value: number): void {
    const update = { offsetX: Number(value) };
    this.writeValue(update);
  }

  onOffsetYChange(value: number): void {
    const update = { offsetY: Number(value) };
    this.writeValue(update);
  }

  onBlurChange(value: number): void {
    const update = { blurRadius: Number(value) };
    this.writeValue(update);
  }

  onSpreadChange(value: number): void {
    const update = { spreadRadius: Number(value) };
    this.writeValue(update);
  }

  onColorMenuSelect(item: ISelectItem) {
    if (item.action) {
      this.action.emit(item);
    } else {
      const updatedValue = { color: { value: item.value } };
      this.writeValue(updatedValue);
    }
  }

  createColorPicker(): void {
    const color = String(this.value.color.value) || '';
    this.picker?.createColorPicker(color, true);
  }
}
