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
  ChangeDetectorRef,
  ElementRef,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  ViewChild,
} from '@angular/core';

import { OverlayService } from '../../overlay/overlay.service';
import { HSVColor, isGradient, TRANSPARENT } from 'cd-utils/color';
import { ISelectItem, IDesignColor } from 'cd-interfaces';
import { InputCollectionDirective } from '../abstract/abstract.input.collection';
import { isString } from 'cd-utils/string';
import { toPercent, toDecimal } from 'cd-utils/numeric';
import { isObject } from 'cd-utils/object';
import { opacityMenuConfig } from 'cd-common/consts';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ColorPickerDirective } from './picker.directive';

@Component({
  selector: 'cd-color-input',
  templateUrl: './color-input.component.html',
  styleUrls: ['./color-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OverlayService],
})
export class ColorInputComponent extends InputCollectionDirective {
  protected _value: HSVColor = new HSVColor(255, 0, 0, 1);
  private _disableGradient = false;
  private _hideOpacity = false;
  public alpha = 100;
  public focusButton = false;
  public gradient?: string;
  public opacityAutocomplete = opacityMenuConfig;
  public gradientMenu: ISelectItem[] = [];

  @Input() colorData: ReadonlyArray<ISelectItem> = [];
  @Input() binding: IDesignColor | undefined;
  @Input() bottomLabel?: string;

  @Input()
  @HostBinding('class.hide-opacity')
  set hideOpacity(value: string | boolean) {
    this._hideOpacity = coerceBooleanProperty(value);
  }
  get hideOpacity() {
    return this._hideOpacity;
  }

  @Input()
  set disableGradient(value: boolean) {
    this._disableGradient = coerceBooleanProperty(value);
  }
  get disableGradient() {
    return this._disableGradient;
  }

  @HostBinding('class.show-chip')
  get showChip() {
    return !!this.binding;
  }

  @Input()
  get value(): string {
    return this._value.hexString;
  }
  set value(value: string) {
    if (!value) return;
    this.gradient = isGradient(value) ? value : '';
    const { rgbaString, hexString, alpha } = this._value;
    const rgbMatch = rgbaString === value;
    const hexMatch = hexString === value && alpha === 1;
    if (rgbMatch || hexMatch) return;
    const newColor = HSVColor.parse(value);
    if (newColor.equals(this._value)) return;
    this._value = newColor;
    this.alpha = toPercent(newColor.alpha);
  }

  @Output() colorSelect = new EventEmitter<ISelectItem>();
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild(ColorPickerDirective, { read: ColorPickerDirective }) picker?: ColorPickerDirective;

  constructor(
    protected _overlayService: OverlayService,
    protected _cdRef: ChangeDetectorRef,
    protected _elemRef: ElementRef
  ) {
    super(_elemRef);
  }

  get rgbaString(): string {
    return this._value.rgbaString;
  }

  get showOpacity() {
    return !this._hideOpacity;
  }

  get hexValue() {
    return this._value.hexString;
  }

  onGradientPick = (gradient: string): void => {
    this.gradient = gradient;
    this.valueChange.emit(gradient);
    this._cdRef.markForCheck();
  };

  onColorPick = (color: HSVColor): void => {
    const [r, g, b, a] = color.rgba;
    this.gradient = '';
    this._value = new HSVColor(r, g, b, a);
    this.alpha = toPercent(a);
    this.writeColor();
    this._cdRef.markForCheck();
  };

  onSwatchClick() {
    const color = this.gradient || this.rgbaString;
    this.picker?.createColorPicker(color, this.disableGradient);
  }

  writeColor() {
    this.valueChange.emit(this.rgbaString);
  }

  onSelect(value: ISelectItem | string) {
    if (isString(value)) {
      const newColor = HSVColor.parse(value);
      if (newColor) {
        if (value !== TRANSPARENT) {
          newColor.alpha = this._value.alpha;
        }

        this.value = newColor.rgbaString;
        this.writeColor();
      }
    } else {
      this.colorSelect.emit(value);
      this.focusButton = true;
    }
  }

  onAlphaChange(item: ISelectItem | number) {
    const percent = isObject(item) ? (item as ISelectItem).value : item;
    const value = Number(percent);
    this._value.alpha = toDecimal(value);
    this.alpha = value;
    this._cdRef.markForCheck();
    this.writeColor();
  }

  onRemoveChip() {
    if (this.binding) {
      this.valueChange.emit(this.binding.value);
    }
  }

  onGradientMenuChange(item: ISelectItem) {
    console.log('grad menu change', item);
  }
}
