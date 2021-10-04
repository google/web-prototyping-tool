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
  RGB_MAX,
  D65_NORMALIZATION,
  LAB_EPSILON,
  HEX_COLOR_REGEX,
  HEX_HASH,
  RGB_REGEX,
} from './consts';
import { RGB, HSL, HSV, LAB, LCH } from './models';
import { clamp, toDegrees, toRadians, half } from 'cd-utils/numeric';

/**
 * Given a color string, an rgb(a) value will be returned when attached
 * and evaluated with window.getComputedStyle
 * @param text
 */

class CacheStringMap {
  private _cache = new Map<string, string>();
  private _limit = 32;

  constructor(limit?: number) {
    if (!limit) return;
    this._limit = limit;
  }

  checkCacheSize() {
    const { _cache, _limit } = this;
    if (_cache.size !== _limit) return;
    const [first] = _cache.keys();
    _cache.delete(first);
  }

  set(key: string, value: string) {
    this.checkCacheSize();
    this._cache.set(key, value);
  }

  get(key: string): string | undefined {
    return this._cache.get(key);
  }
}

const THREE_SIXTY = 360;
const ONE_EIGHTY = 180;

let colorEl: HTMLDivElement;
const colorCache = new CacheStringMap();

export const evaluateColorString = (text: string): string | null => {
  const colorFromCache = colorCache.get(text);
  if (colorFromCache) return colorFromCache;
  if (!colorEl) {
    colorEl = document.createElement('DIV') as HTMLDivElement;
    document.body.appendChild(colorEl);
    colorEl.style.visibility = 'hidden';
  }
  colorEl.style.backgroundColor = text.toLowerCase();
  const { backgroundColor } = window.getComputedStyle(colorEl);
  if (backgroundColor) colorCache.set(text, backgroundColor);
  return backgroundColor;
};

export const stringFromColor = (
  prefix: string,
  values: (string | number)[],
  alpha: number
): string => {
  const opaque = alpha === 1;
  const start = opaque ? prefix : prefix + 'a';
  const colorArray = opaque ? values : [...values, alpha];
  const joinColors = colorArray.toString();
  return `${start}(${joinColors})`;
};

export const hueFromRgb = (min: number, max: number, diff: number, rgb: RGB): number => {
  const [r, g, b] = rgb;
  if (min === max) return 0;

  const oneSixth = 1 / 6;

  if (r === max) return ((oneSixth * (g - b)) / diff + 1) % 1;
  if (g === max) return (oneSixth * (b - r)) / diff + 1 / 3;
  return (oneSixth * (r - g)) / diff + 2 / 3;
};

export const generateSaturation = (lum: number, diff: number, add: number): number => {
  if (lum === 0 || lum === 1) return 0;
  if (lum <= 0.5) return diff / add;
  return diff / (2 - add);
};

export const hue2rgb = (p: number, q: number, h: number): number => {
  if (h < 0) h += 1;
  if (h > 1) h -= 1;
  if (h < 1 / 6) return p + (q - p) * h * 6;
  if (h < 1 / 2) return q;
  if (h < 2 / 3) return p + (q - p) * (2 / 3 - h) * 6;
  return p;
};

export const hsl2rgb = (hsl: HSL): RGB => {
  const [h, s, l] = hsl;
  const sa = s < 0 ? 0 : s;
  const q = l < 0.5 ? l * (1 + sa) : l + sa - l * sa;
  const p = 2 * l - q;
  const oneThird = 1 / 3;
  const r = Math.round(hue2rgb(p, q, h + oneThird) * RGB_MAX);
  const g = Math.round(hue2rgb(p, q, h) * RGB_MAX);
  const b = Math.round(hue2rgb(p, q, h - oneThird) * RGB_MAX);
  return [r, g, b];
};

export const hsl2Hsv = (hsl: HSL): HSV => {
  const [h, s, l] = hsl;
  const sa = s * (l < 0.5 ? l : 1 - l);
  const saturation = sa === 0 ? 0 : (2 * sa) / (l + sa);
  const value = l + sa;
  return [h, saturation, value];
};

export const hsv2Hsl = (hsv: HSV): HSL => {
  const [h, s, v] = hsv;
  const t = (2 - s) * v;
  const sat = v === 0 || s === 0 ? 0 : (s * v) / (t < 1 ? t : 2 - t);
  const lum = half(t);
  return [h, sat, lum];
};

export const rgb2Hsl = (rgb: RGB): HSL => {
  const divideRGB = rgb.map((item) => item / RGB_MAX) as RGB;
  const min = Math.min(...divideRGB);
  const max = Math.max(...divideRGB);
  const diff = max - min;
  const add = max + min;
  const hue = hueFromRgb(min, max, diff, divideRGB);
  const lum = half(add);
  const sat = generateSaturation(lum, diff, add);
  return [hue, sat, lum];
};

export const rgb2hex = (rgba: number[]): string => {
  const converted = rgba
    .map((value) => {
      const hex = Math.round(value).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');

  return `#${converted.toUpperCase()}`;
};

export const rgb2Lab = (rgb: RGB): LAB => {
  const preMultRgb = rgb.map((color) => color / 255);
  const rLin = srgb2Linear(preMultRgb[0]);
  const gLin = srgb2Linear(preMultRgb[1]);
  const bLin = srgb2Linear(preMultRgb[2]);
  const x = 0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin;
  const y = 0.2126729 * rLin + 0.7151522 * gLin + 0.072175 * bLin;
  const z = 0.0193339 * rLin + 0.119192 * gLin + 0.9503041 * bLin;
  const xNorm = x / D65_NORMALIZATION.x;
  const yNorm = y / D65_NORMALIZATION.y;
  const zNorm = z / D65_NORMALIZATION.z;
  const lightness = 116 * xyz2Lab(yNorm) - 16;
  const a = 500 * (xyz2Lab(xNorm) - xyz2Lab(yNorm));
  const b = 200 * (xyz2Lab(yNorm) - xyz2Lab(zNorm));

  return [lightness, a, b];
};

export const hex2rgb = (hex: string): RGB => {
  const parsed = parseInt(hex.substring(1), 16);
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return [r, g, b];
};

export const rgbStringToRgb = (color: string): RGB => {
  const values = color.match(RGB_REGEX) as string[];
  return values.map(Number) as RGB;
};

export const rgbFromColorString = (color: string): RGB => {
  return color.includes(HEX_HASH) ? hex2rgb(color) : rgbStringToRgb(color);
};

export function enforceRange(value: number, min: number, max: number, name: string) {
  if (isNaN(value) || value < min || value > max) {
    throw new RangeError(`${value} for ${name} is not between ${min} and ${max}`);
  }
}

export function getHexDigits(value: number): string {
  const converted = value.toString(16);
  return converted.length >= 2 ? converted : '0' + converted;
}

export function srgb2Linear(val: number): number {
  const alpha = 0.055;
  if (val <= 0.04045) return val / 12.92;
  return ((val + alpha) / (1 + alpha)) ** 2.4;
}

export function linear2Srgb(val: number): number {
  const alpha = 0.055;
  if (val <= 0.0031308) return 12.92 * val;
  return (1 + alpha) * val ** (1 / 2.4) - alpha;
}

export function xyz2Lab(val: number): number {
  const delta = 6 / 29;
  const delta3 = delta ** 3;
  const mult = 1 / (3 * delta ** 2);

  if (val > delta3) return val ** (1 / 3);
  return mult * val + 4 / 29;
}

export function labToXyzUtility(val: number): number {
  const delta = 6 / 29;
  const multiplier = 3 * delta ** 2;
  if (val > delta) return val ** 3;
  return multiplier * (val - 4 / 29);
}

export function lab2Lch(val: LAB): LCH {
  const [lightness, a, b] = val;
  const chroma = Math.sqrt(a ** 2 + b ** 2);
  const hue = (toDegrees(Math.atan2(b, a)) + THREE_SIXTY) % THREE_SIXTY;

  return [lightness, chroma, hue];
}

export function lch2Lab(val: LCH): LAB {
  const [lightness, chroma, hue] = val;
  const hueRadians = toRadians(hue);
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);

  return [lightness, a, b];
}

export function lab2Rgb(val: LAB): RGB {
  const [labLightness, labA, labB] = val;
  const lightnessIntermediate = (labLightness + 16) / 116;
  const x = D65_NORMALIZATION.x * labToXyzUtility(lightnessIntermediate + labA / 500);
  const y = D65_NORMALIZATION.y * labToXyzUtility(lightnessIntermediate);
  const z = D65_NORMALIZATION.z * labToXyzUtility(lightnessIntermediate - labB / 200);
  const rLinear = 3.2404542 * x + -1.5371385 * y + -0.4985314 * z;
  const gLinear = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bLinear = 0.0556434 * x + -0.2040259 * y + 1.0572252 * z;
  const r = clamp(linear2Srgb(rLinear), 0, 1);
  const g = clamp(linear2Srgb(gLinear), 0, 1);
  const b = clamp(linear2Srgb(bLinear), 0, 1);

  return [r, g, b];
}

export function distanceFrom(first: LAB, other: LAB): number {
  const [firstLightness, firstA, firstB] = first;
  const [otherLightness, otherA, otherB] = other;
  const kLightness = 1;
  const kChroma = 1;
  const kHue = 1;
  const deltaLPrime = otherLightness - firstLightness;
  const lBar = (firstLightness + otherLightness) / 2;
  const thisChroma = Math.sqrt(firstA ** 2 + firstB ** 2);
  const otherChroma = Math.sqrt(otherA ** 2 + otherB ** 2);
  const chromaBar = (thisChroma + otherChroma) / 2;
  const aPrimeIntermediate = 0.5 * (1 - Math.sqrt(chromaBar ** 7 / (chromaBar ** 7 + 25 ** 7)));
  const thisAPrime = firstA * (1 + aPrimeIntermediate);
  const otherAPrime = otherA * (1 + aPrimeIntermediate);
  const thisChromaPrime = Math.sqrt(thisAPrime ** 2 + firstB ** 2);
  const otherChromaPrime = Math.sqrt(otherAPrime ** 2 + otherB ** 2);
  const deltaChromaPrime = otherChromaPrime - thisChromaPrime;
  const chromaPrimeBar = (thisChromaPrime + otherChromaPrime) / 2;
  const thisHuePrime = DELTA_E_UTILS.huePrime(firstB, thisAPrime);
  const otherHuePrime = DELTA_E_UTILS.huePrime(otherB, otherAPrime);
  const deltaHuePrime = DELTA_E_UTILS.deltaHuePrime(
    thisChroma,
    otherChroma,
    thisHuePrime,
    otherHuePrime
  );

  const deltaHPrime =
    2 * Math.sqrt(thisChromaPrime * otherChromaPrime) * Math.sin(toRadians(deltaHuePrime / 2));
  const hBarPrime = DELTA_E_UTILS.hBarPrime(thisChroma, otherChroma, thisHuePrime, otherHuePrime);

  const t =
    1 -
    0.17 * Math.cos(toRadians(hBarPrime - 30)) +
    0.24 * Math.cos(toRadians(2 * hBarPrime)) +
    0.32 * Math.cos(toRadians(3 * hBarPrime + 6)) -
    0.2 * Math.cos(toRadians(4 * hBarPrime - 63));

  const sLightness = 1 + (0.015 * (lBar - 50) ** 2) / Math.sqrt(20 + (lBar - 50) ** 2);
  const sChroma = 1 + 0.045 * chromaPrimeBar;
  const sHue = 1 + 0.015 * chromaPrimeBar * t;
  const rT =
    -2 *
    Math.sqrt(chromaPrimeBar ** 7 / (chromaPrimeBar ** 7 + 25 ** 7)) *
    Math.sin(toRadians(60 * Math.exp(-(((hBarPrime - 275) / 25) ** 2))));

  return Math.sqrt(
    (deltaLPrime / (sLightness * kLightness)) ** 2 +
      (deltaChromaPrime / (sChroma * kChroma)) ** 2 +
      (deltaHPrime / (sHue * kHue)) ** 2 +
      rT * (deltaChromaPrime / (sChroma * kChroma)) * (deltaHPrime / (sHue * kHue))
  );
}

export const DELTA_E_UTILS = {
  huePrime(b: number, aPrime: number): number {
    if (Math.abs(b) < LAB_EPSILON && Math.abs(aPrime) < LAB_EPSILON) return 0;
    const hueAngle = toDegrees(Math.atan2(b, aPrime));
    return hueAngle >= 0 ? hueAngle : hueAngle + THREE_SIXTY;
  },

  deltaHuePrime(chroma1: number, chroma2: number, huePrime1: number, huePrime2: number): number {
    if (Math.abs(chroma1) < LAB_EPSILON || Math.abs(chroma2) < LAB_EPSILON) return 0;
    if (Math.abs(huePrime2 - huePrime1) <= ONE_EIGHTY) return huePrime2 - huePrime1;
    if (huePrime2 <= huePrime1) return huePrime2 - huePrime1 + THREE_SIXTY;
    return huePrime2 - huePrime1 - THREE_SIXTY;
  },

  hBarPrime(chroma1: number, chroma2: number, huePrime1: number, huePrime2: number): number {
    if (Math.abs(chroma1) < LAB_EPSILON || Math.abs(chroma2) < LAB_EPSILON) return 0;
    if (Math.abs(huePrime2 - huePrime1) <= ONE_EIGHTY) return (huePrime1 + huePrime2) / 2;
    if (huePrime1 + huePrime2 < THREE_SIXTY) return (huePrime1 + huePrime2 + THREE_SIXTY) / 2;
    return (huePrime1 + huePrime2 - THREE_SIXTY) / 2;
  },
};

export const rgbToLum = (rgb: RGB) => {
  const a = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const contrastRatio = (colorA: RGB, colorB: RGB) => {
  const lumA = rgbToLum(colorA) + 0.05;
  const lumB = rgbToLum(colorB) + 0.05;
  return lumA / lumB;
};

export const evalStringToHex = (text: string): string => {
  if (text.length === 3 || text.length === 6) {
    const hexValue = text.match(HEX_COLOR_REGEX);
    const hex = hexValue && hexValue.join('');
    if (hex) {
      const prefix = hex.includes(HEX_HASH) ? '' : HEX_HASH;
      return prefix + hex;
    }
  }
  return text;
};
