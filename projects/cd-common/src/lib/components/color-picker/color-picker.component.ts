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
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  ViewChild,
  HostBinding,
  ElementRef,
} from '@angular/core';

import { OverlayInitService } from '../overlay/overlay.init.service';
import { HSVColor, IColorWithTonalPalette, isGradient } from 'cd-utils/color';
import { GradientComponent } from './gradient/gradient.component';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { createTonalPalette, tonalPaletteToHex } from 'cd-themes';
import SWATCH_CONFIG from './swatch.config';
import { ColorComponent } from './color/color.component';

@Component({
  selector: 'cd-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent implements AfterViewInit {
  private _color = '#000000';
  private _disableGradient = false;
  public swatches = SWATCH_CONFIG;
  public gradientMode = false;
  public activeGradientStop = '';

  @HostBinding('attr.tabindex')
  tabindex = 0;

  @Input()
  set disableGradient(value: boolean) {
    this._disableGradient = coerceBooleanProperty(value);
  }
  get disableGradient(): boolean {
    return this._disableGradient;
  }

  @Input()
  get color() {
    return this._color;
  }
  set color(value) {
    if (this._disableGradient) {
      this._color = value;
      return;
    }
    this.gradientMode = isGradient(value);
    if (!this.gradientMode) {
      this.activeGradientStop = '';
    }
    this._color = value;
  }

  @Output() pick = new EventEmitter<HSVColor>();
  @Output() pickGradient = new EventEmitter<string>();
  @Output() tonalPalettePick = new EventEmitter<IColorWithTonalPalette>();

  @ViewChild('gradRef', { read: GradientComponent }) _gradRef!: GradientComponent;
  @ViewChild('colorRef', { read: ColorComponent }) _colorRef!: ColorComponent;

  constructor(private _overlayInit: OverlayInitService, private _elemRef: ElementRef) {}

  get activeTab() {
    return Number(this.gradientMode);
  }

  get canShowGradient() {
    return this.disableGradient === false;
  }

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
    setTimeout(this.focusOnContainer, 0);
  }

  /**
   * Ensure that this element has appeared before focusing
   * Focusing on this element allows for using the Esc key to close in an overlay context
   * */
  focusOnContainer = () => {
    this._elemRef.nativeElement.focus();
  };

  onSwatchClick(color: string): void {
    this.color = color;
    const newColor = HSVColor.parse(color);
    this.pick.emit(newColor);
    const tonalPalette = tonalPaletteToHex(createTonalPalette(newColor));
    this.tonalPalettePick.emit({ color: newColor, tonalPalette });
  }

  onTonalPaletteChange(value: IColorWithTonalPalette) {
    this.tonalPalettePick.emit(value);
  }

  onColorChange(color: HSVColor) {
    this.pick.emit(color);
    this._color = color.rgbaString;
  }

  swatchTrackFn(_idx: number, item: { color: string; title: string }) {
    return _idx + item.color;
  }

  onGradient(value: string) {
    this.pickGradient.emit(value);
  }

  onActiveGradientStop(value: string) {
    if (this.activeGradientStop === value) return;
    this.activeGradientStop = value;
  }

  onTabChange(idx: number) {
    const isGradientTab = idx === 1;

    if (isGradientTab) {
      const value = this._gradRef.gradientValue;
      this.pickGradient.emit(value);
      this.color = value;
    } else {
      const color = this.activeGradientStop || this._color;
      this.activeGradientStop = '';
      this.onSwatchClick(color);
    }
  }
}
