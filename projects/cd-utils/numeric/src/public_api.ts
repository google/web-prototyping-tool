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

export const toPercent = (decimal: number): number => Math.round(decimal * 100);

export const toDecimal = (percent: number): number => percent / 100;

export const toDegrees = (angleRadians: number): number => (angleRadians * 180) / Math.PI;

export const toRadians = (angleDegrees: number): number => (angleDegrees * Math.PI) / 180;

export const clamp = (val: number, min: number, max: number): number => {
  return Math.min(max, Math.max(val, min));
};

/**
 *
 * @param value Value to negate
 * @param check Negate if value
 */
export const negate = (value: number, check: boolean = true): number => {
  return check === true ? value * -1 : value;
};

/**
 *
 * @param value
 */
export const half = (value: number): number => value * 0.5;

/**
 *
 * @param value
 */
export const roundToDecimal = (value: number, numDecimals: number): number => {
  const amount = 10 ** numDecimals;
  return Math.round(value * amount) / amount;
};

/**
 * Returns the number of decimals in number
 */
export const countDecimals = (value: number): number => {
  if (Math.floor(value) === value) return 0;
  return String(value).split('.')[1]?.length || 0;
};

export const isNumber = (value: any): value is number => {
  return isNaN(parseFloat(value)) === false && isFinite(value);
};

export const isWithinRange = (a: number, b: number, threshold: number): boolean => {
  return Math.abs(a - b) < threshold;
};

/**
 * Return true/false if value is between a and b
 * @param value
 * @param a
 * @param b
 */
export const isBetween = (value: number, a: number, b: number, inclusive = true): boolean => {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return inclusive ? value >= min && value <= max : value > min && value < max;
};

/**
 * Characters (in sorted order) used in a base 62 number
 */
export const BASE_62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Convert a base 10 integer into base 62
 */
export const toBase62 = (integer: number): string => {
  if (integer === 0) return '0';

  const base62Str: string[] = [];
  while (integer > 0) {
    const nextChar = BASE_62_CHARS[integer % 62];
    base62Str.push(nextChar);
    integer = Math.floor(integer / 62);
  }
  return base62Str.reverse().join('');
};
