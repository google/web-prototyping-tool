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
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { copyToClipboard } from 'cd-utils/clipboard';
import { toPercent, toDecimal } from 'cd-utils/numeric';
import { findClosestPalette, createTonalPalette, tonalPaletteToHex } from 'cd-themes';
import { HSVColor, IColorWithTonalPalette } from 'cd-utils/color';
import { IHSV } from '../hsv-box/hsv-box.component';

@Component({
  selector: 'cd-color',
  templateUrl: './color.component.html',
  styleUrls: ['./color.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorComponent {
  private _color: HSVColor = new HSVColor(255, 0, 0);
  private _showRGB = false;
  private _tonalPalette: string[] = [];
  private _tonalPaletteIndex?: number;
  private _hsvInteracting = false;
  public hsv: IHSV = { value: 0, saturation: 0 };

  @Output() colorChange = new EventEmitter<HSVColor>();
  @Output() tonalPaletteChange = new EventEmitter<IColorWithTonalPalette>();

  get hsvColor(): HSVColor {
    return this._color;
  }

  @Input()
  set color(text: string) {
    if (this._hsvInteracting) return;
    const newColor = HSVColor.parse(text);
    const equal = this._color.equals(newColor);
    if (equal === true) return;
    this._color = newColor;
    this.updateHSV(newColor);
    this.createTonalPalette(newColor);
  }

  get tonalPalette() {
    return this._tonalPalette || [];
  }
  @Input()
  set tonalPalette(palette: Array<string>) {
    this._tonalPalette = palette;
  }

  get tonalPaletteIndex(): number {
    return this._tonalPaletteIndex || 0;
  }
  set tonalPaletteIndex(index: number) {
    this._tonalPaletteIndex = index;
  }

  get alphaSliderStyle(): object {
    const rgba: number[] = this._color.rgba;
    const rgbString: string = rgba.slice(0, -1).join(', ');
    const background = `linear-gradient(to right, rgba(${rgbString}, 0), rgba(${rgbString}, 1))`;
    return { background };
  }

  get colorMode(): boolean {
    return this._showRGB;
  }

  set hue(value) {
    const { hue } = this._color;
    if (value !== hue) {
      this._color.hue = value;
      this.createTonalPalette(this.hsvColor);
      this.emitChanges(this._color, this._tonalPalette);
    }
  }

  get alphaValue(): number {
    return this._color.alpha * 100;
  }

  get rgbaString(): string {
    return this._color.rgbaString;
  }

  get rgb(): number[] {
    return this._color.rgb;
  }

  get hexString(): string {
    return this._color.hexString;
  }

  get hue(): number {
    return this._color.hue;
  }

  get hslStringWithHue(): string {
    return `hsl(${this.hue}, 100%, 50%)`;
  }

  get alpha(): number {
    return toPercent(this._color.alpha);
  }

  set alpha(value: number) {
    const { alpha } = this._color;

    if (value !== alpha) {
      this._color.alpha = value;
      this.emitChanges(this._color, this._tonalPalette);
    }
  }

  set hexInput(value: string) {
    const alpha = this._color.alpha;
    this.updateColor(value, alpha);
  }

  constructor(private _cdRef: ChangeDetectorRef) {}

  updateColor(color: string, alpha?: number, updateTonalPalette = false) {
    const newColor = HSVColor.parse(color);
    if (alpha !== undefined) {
      newColor.alpha = alpha;
    }
    this._color = newColor;
    this.emitChanges(newColor, this._tonalPalette);
    this.updateHSV(newColor);
    if (updateTonalPalette) {
      this.createTonalPalette(newColor);
    }
    this._cdRef.markForCheck();
  }

  updateHSV(newColor: HSVColor) {
    const { value, saturation } = newColor;
    this.hsv = { value, saturation };
  }

  emitChanges(color: HSVColor, tonalPalette: string[]) {
    this.colorChange.emit(color);
    this.emitTonalPaletteChanges(color, tonalPalette);
  }

  onAlphaChange(value: number): void {
    this.alpha = toDecimal(value);
  }

  onHueChange(value: number): void {
    this.hue = value;
  }

  onHexInput(color: string) {
    this.hexInput = color;
    this.createTonalPalette(this._color);
  }

  onMainSwatchClick(): void {
    const { alpha, hexString, rgbaString } = this;
    copyToClipboard(alpha !== 100 ? rgbaString : hexString);
  }

  onTonalPaletteChange(index: number) {
    this.tonalPaletteIndex = index;
    const colorFromIndex = this.tonalPalette[index];
    this.updateColor(colorFromIndex, 1);
  }

  onRedChange(value: number) {
    const [, ...gba] = this._color.rgba;
    this.updateRGBA([value, ...gba]);
  }

  onGreenChange(value: number) {
    const [r, , b, a] = this._color.rgba;
    this.updateRGBA([r, value, b, a]);
  }

  onBlueChange(value: number) {
    const [r, g, , a] = this._color.rgba;
    this.updateRGBA([r, g, value, a]);
  }

  onAlphaInput(value: number) {
    this.onAlphaChange(value);
  }

  toggleColorMode() {
    this._showRGB = !this._showRGB;
  }

  private emitTonalPaletteChanges(color: HSVColor, tonalPalette: string[]) {
    const update: IColorWithTonalPalette = { color, tonalPalette };
    this.tonalPaletteChange.emit(update);
  }

  private createTonalPalette(color: HSVColor) {
    const newTonalPalette = tonalPaletteToHex(createTonalPalette(color));
    const { closestColorIndex } = findClosestPalette(color);
    this.tonalPalette = newTonalPalette;
    this.tonalPaletteIndex = closestColorIndex;
  }

  onHSVChange({ saturation, value }: IHSV) {
    const { _color } = this;
    const hasChanged = _color.saturation !== saturation || _color.value !== value;
    if (!hasChanged) return;
    _color.saturation = saturation;
    _color.value = value;
    this.createTonalPalette(_color);
    this.emitChanges(this._color, this._tonalPalette);
  }

  private updateRGBA(rgba: number[]) {
    const newColor = new HSVColor(...rgba);
    this.updateColor(newColor.rgbaString, undefined, true);
  }

  onHSVInteracting(dragging: boolean) {
    this._hsvInteracting = dragging;
  }
}
