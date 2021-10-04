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

import { RGB_MAX, HUE_MAX } from './consts';
import { toPercent } from 'cd-utils/numeric';
import {
  stringFromColor,
  hsl2Hsv,
  rgb2Hsl,
  hsv2Hsl,
  rgb2hex,
  hsl2rgb,
  evaluateColorString,
  rgb2Lab,
  lab2Lch,
  evalStringToHex,
  rgbStringToRgb,
} from './utils';

export type RGB = [number, number, number];
export type HSL = [number, number, number];
export type HSV = [number, number, number];
export type LAB = [number, number, number];
export type LCH = [number, number, number];

export interface IColorWithTonalPalette {
  color: HSVColor;
  tonalPalette: string[];
}

export interface IClosestPaletteResult {
  closestPalette: ReadonlyArray<LAB>;
  closestColorIndex: number;
}

export class HSVColor {
  private _hue: number;
  private _saturation: number;
  private _value: number;

  static rgbToHSV(rgb: RGB): HSV {
    const hsl = rgb2Hsl(rgb);
    return hsl2Hsv(hsl);
  }

  static parse(text: string): HSVColor {
    const evalColor = evalStringToHex(text);
    const colorString = evaluateColorString(evalColor);
    const rgb = colorString ? rgbStringToRgb(colorString) : [];
    return new HSVColor(...rgb);
  }

  constructor(
    red: number = RGB_MAX,
    green: number = RGB_MAX,
    blue: number = RGB_MAX,
    private _alpha: number = 1
  ) {
    const [hue, sat, value] = HSVColor.rgbToHSV([red, green, blue]);

    this._hue = hue;
    this._saturation = sat;
    this._value = value;
  }

  equals(color: HSVColor): boolean {
    const { hue, saturation, value, alpha } = color;
    return (
      this.alpha === alpha &&
      this.hue === hue &&
      this.saturation === saturation &&
      this.value === value
    );
  }

  public get value(): number {
    return this._value;
  }

  public set value(value: number) {
    this._value = value;
  }

  public get saturation(): number {
    return this._saturation;
  }

  public set saturation(value: number) {
    this._saturation = value;
  }

  public get alpha(): number {
    return this._alpha;
  }

  public set alpha(value: number) {
    this._alpha = value;
  }

  public set hue(value: number) {
    this._hue = value / HUE_MAX;
  }

  public get hue(): number {
    return Math.round(this._hue * HUE_MAX);
  }

  public get hsl(): HSL {
    return hsv2Hsl(this.hsv);
  }

  public get hsv(): HSV {
    const { _hue, _saturation, _value } = this;
    return [_hue, _saturation, _value];
  }

  public get rgb(): RGB {
    return hsl2rgb(this.hsl);
  }

  public get rgba(): number[] {
    const { rgb, alpha } = this;
    return [...rgb, alpha];
  }

  public get rgbaString(): string {
    const { rgb, _alpha } = this;
    return stringFromColor('rgb', rgb, _alpha);
  }

  public get hslaString(): string {
    const { hsl, _alpha } = this;
    const [hue, sat, lum] = hsl;
    const h = Math.round(hue * HUE_MAX);
    const s = toPercent(sat);
    const l = toPercent(lum);
    const values = [h, `${s}%`, `${l}%`];

    return stringFromColor('hsl', values, _alpha);
  }

  public get hexString(): string {
    const { rgb } = this;
    return rgb2hex(rgb);
  }

  public get hexStringWithAlpha(): string {
    const { rgb, _alpha } = this;
    return rgb2hex([...rgb, _alpha * RGB_MAX]);
  }

  public get lab(): LAB {
    const { rgb } = this;
    return rgb2Lab(rgb);
  }

  public get lch(): LCH {
    const { rgb } = this;
    const lab = rgb2Lab(rgb);

    return lab2Lch(lab);
  }

  stringWithAlpha(alpha: number) {
    const { rgb } = this;
    const newColorWithAlpha = new HSVColor(...rgb, alpha);
    return newColorWithAlpha.rgbaString;
  }
}
