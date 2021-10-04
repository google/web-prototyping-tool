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

/**
 * Utils based on:
 * https://observablehq.com/@dgreensp/implementing-fractional-indexing
 */

// use base 62 (all alpha-numeric characters in ascending order)
const DIGITS = Object.freeze('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');

const INTEGER_ZERO = 'a0';

const SMALLEST_INTEGER = 'A00000000000000000000000000';

export const getIntegerLength = (head: string): number => {
  if (head >= 'a' && head <= 'z') {
    return head.charCodeAt(0) - 'a'.charCodeAt(0) + 2;
  }
  if (head >= 'A' && head <= 'Z') {
    return 'Z'.charCodeAt(0) - head.charCodeAt(0) + 2;
  }
  throw new Error('Invalid order key head: ' + head);
};

export const validateInteger = (int: string) => {
  if (int.length !== getIntegerLength(int.charAt(0))) {
    throw new Error('invalid integer part of order key: ' + int);
  }
};

export const getIntegerPart = (key: string): string => {
  const integerPartLength = getIntegerLength(key.charAt(0));
  if (integerPartLength > key.length) throw new Error('invalid order key: ' + key);

  return key.slice(0, integerPartLength);
};

export const validateOrderKey = (key: string) => {
  if (key === SMALLEST_INTEGER) throw new Error('invalid order key: ' + key);

  // getIntegerPart will throw if the first character is bad,
  // or the key is too short.  we'd call it to check these things
  // even if we didn't need the result
  const i = getIntegerPart(key);
  const f = key.slice(i.length);
  if (f.slice(-1) === '0') throw new Error('invalid order key: ' + key);
};

export const incrementInteger = (x: string) => {
  validateInteger(x);

  const [head, ...digs] = x.split('');
  let carry = true;

  for (let i = digs.length - 1; carry && i >= 0; i--) {
    const d = DIGITS.indexOf(digs[i]) + 1;
    if (d === DIGITS.length) {
      digs[i] = '0';
    } else {
      digs[i] = DIGITS.charAt(d);
      carry = false;
    }
  }

  if (!carry) return head + digs.join('');

  if (head === 'Z') return 'a0';

  if (head === 'z') return null;

  const h = String.fromCharCode(head.charCodeAt(0) + 1);
  if (h > 'a') digs.push('0');
  else digs.pop();

  return h + digs.join('');
};

// note that this may return null, as there is a smallest integer
export const decrementInteger = (x: string) => {
  validateInteger(x);

  const [head, ...digs] = x.split('');
  let borrow = true;
  for (let i = digs.length - 1; borrow && i >= 0; i--) {
    const d = DIGITS.indexOf(digs[i]) - 1;
    if (d === -1) {
      digs[i] = DIGITS.slice(-1);
    } else {
      digs[i] = DIGITS.charAt(d);
      borrow = false;
    }
  }

  if (!borrow) return head + digs.join('');

  if (head === 'a') return 'Z' + DIGITS.slice(-1);

  if (head === 'A') return null;

  const h = String.fromCharCode(head.charCodeAt(0) - 1);
  if (h < 'Z') digs.push(DIGITS.slice(-1));
  else digs.pop();

  return h + digs.join('');
};

/**
 * `a` may be empty string, `b` is null or non-empty string.
 * `a < b` lexicographically if `b` is non-null
 * trailing zeros are not allowed.
 */
export const midpoint = (a: string | null, b: string | null): string => {
  // If a is null, convert to empty string so that it always sorts to front
  a = !a ? '' : a;

  // Cannot find the midpoint between a and b if a is greater than b
  if (b !== null && a >= b) {
    throw new Error(a + ' >= ' + b);
  }

  // trailing zeros are not allowed
  if (a.slice(-1) === '0' || (b && b.slice(-1) === '0')) {
    throw new Error('trailing zero');
  }

  if (b) {
    // remove longest common prefix.  pad `a` with 0s as we
    // go.  note that we don't need to pad `b`, because it can't
    // end before `a` while traversing the common prefix.
    let n = 0;
    while ((a.charAt(n) || '0') === b.charAt(n)) {
      n++;
    }
    if (n > 0) {
      const commonPrefix = b.slice(0, n);
      const aWithoutPrefix = a.slice(n);
      const bWithoutPrefix = b.slice(n);
      return commonPrefix + midpoint(aWithoutPrefix, bWithoutPrefix);
    }
  }

  // if first digits (or lack of digit) are different
  const digitAIndex = a ? DIGITS.indexOf(a.charAt(0)) : 0;
  const digitBIndex = b ? DIGITS.indexOf(b.charAt(0)) : DIGITS.length;
  if (digitBIndex - digitAIndex > 1) {
    const midDigit = Math.round(0.5 * (digitAIndex + digitBIndex));
    return DIGITS.charAt(midDigit);
  }

  // if first digits are consecutive
  if (b && b.length > 1) return b.slice(0, 1);

  // `b` is null or has length 1 (a single digit).
  // the first digit of `a` is the previous digit to `b`,
  // or 9 if `b` is null.
  // given, for example, midpoint('49', '5'), return
  // '4' + midpoint('9', null), which will become
  // '4' + '9' + midpoint('', null), which is '495'
  return DIGITS.charAt(digitAIndex) + midpoint(a.slice(1), null);
};

// `a` is an order key or null (START).
// `b` is an order key or null (END).
// `a < b` lexicographically if both are non-null.
export const generateIndexBetween = (a: string | null, b: string | null): string | null => {
  if (a !== null) {
    validateOrderKey(a);
  }
  if (b !== null) {
    validateOrderKey(b);
  }

  // a must be less than b to generate a key between
  if (a !== null && b !== null && a >= b) throw new Error(a + ' >= ' + b);

  // If a and b are null, return zero
  if (a === null && b === null) return INTEGER_ZERO;

  if (a === null && b !== null) {
    const ib = getIntegerPart(b);
    const fb = b.slice(ib.length);
    if (ib === SMALLEST_INTEGER) return ib + midpoint('', fb);
    return ib < b ? ib : decrementInteger(ib);
  }

  if (b === null && a !== null) {
    const ia = getIntegerPart(a);
    const fa = a.slice(ia.length);
    const i = incrementInteger(ia);
    return i === null ? ia + midpoint(fa, null) : i;
  }

  const aStr = a as string;
  const bStr = b as string;
  const ia = getIntegerPart(aStr);
  const fa = aStr.slice(ia.length);
  const ib = getIntegerPart(bStr);
  const fb = bStr.slice(ib.length);
  if (ia === ib) return ia + midpoint(fa, fb);

  const i = incrementInteger(ia);
  return i !== null && i < bStr ? i : ia + midpoint(fa, null);
};

// same preconditions as generateKeysBetween.
// n >= 0.
// Returns an array of n distinct keys in sorted order.
// If a and b are both null, returns [a0, a1, ...]
// If one or the other is null, returns consecutive "integer"
// keys.  Otherwise, returns relatively short keys between
// a and b.
export const generateNIndexesBetween = (
  a: string | null,
  b: string | null,
  n: number
): (null | string)[] => {
  if (n === 0) return [];
  if (n === 1) return [generateIndexBetween(a, b)];

  if (b === null) {
    let c = generateIndexBetween(a, b);
    const result = [c];
    for (let i = 0; i < n - 1; i++) {
      c = generateIndexBetween(c, b);
      result.push(c);
    }
    return result;
  }

  if (a === null) {
    let c = generateIndexBetween(a, b);
    const result = [c];
    for (let i = 0; i < n - 1; i++) {
      c = generateIndexBetween(a, c);
      result.push(c);
    }
    result.reverse();
    return result;
  }

  const mid = Math.floor(n / 2);
  const c = generateIndexBetween(a, b);
  return [...generateNIndexesBetween(a, c, mid), c, ...generateNIndexesBetween(c, b, n - mid - 1)];
};
