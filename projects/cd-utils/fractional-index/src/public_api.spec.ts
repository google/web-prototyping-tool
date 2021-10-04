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

import * as utils from './public_api';

describe('Fractional Index Utils', () => {
  it('increments indexes', () => {
    expect(utils.incrementInteger('a0')).toEqual('a1');
    expect(utils.incrementInteger('a1')).toEqual('a2');
    expect(utils.incrementInteger('az')).toEqual('b00');
    expect(utils.incrementInteger('b0z')).toEqual('b10');
    expect(utils.incrementInteger('b1z')).toEqual('b20');
    expect(utils.incrementInteger('bzz')).toEqual('c000');
    expect(utils.incrementInteger('Zy')).toEqual('Zz');
    expect(utils.incrementInteger('Zz')).toEqual('a0');
    expect(utils.incrementInteger('Yzy')).toEqual('Yzz');
    expect(utils.incrementInteger('Yzz')).toEqual('Z0');
    expect(utils.incrementInteger('Xyzz')).toEqual('Xz00');
    expect(utils.incrementInteger('Xz00')).toEqual('Xz01');
    expect(utils.incrementInteger('Xzzz')).toEqual('Y00');
    expect(utils.incrementInteger('dABzz')).toEqual('dAC00');
    expect(utils.incrementInteger('zzzzzzzzzzzzzzzzzzzzzzzzzzz')).toEqual(null);
  });

  it('decrements indexes', () => {
    expect(utils.decrementInteger('a1')).toEqual('a0');
    expect(utils.decrementInteger('a2')).toEqual('a1');
    expect(utils.decrementInteger('b00')).toEqual('az');
    expect(utils.decrementInteger('b10')).toEqual('b0z');
    expect(utils.decrementInteger('b20')).toEqual('b1z');
    expect(utils.decrementInteger('c000')).toEqual('bzz');
    expect(utils.decrementInteger('Zz')).toEqual('Zy');
    expect(utils.decrementInteger('a0')).toEqual('Zz');
    expect(utils.decrementInteger('Yzz')).toEqual('Yzy');
    expect(utils.decrementInteger('Z0')).toEqual('Yzz');
    expect(utils.decrementInteger('Xz00')).toEqual('Xyzz');
    expect(utils.decrementInteger('Xz01')).toEqual('Xz00');
    expect(utils.decrementInteger('Y00')).toEqual('Xzzz');
    expect(utils.decrementInteger('dAC00')).toEqual('dABzz');
    expect(utils.decrementInteger('A00000000000000000000000000')).toEqual(null);
  });

  it('Computes midpoints between 2 indexes', () => {
    expect(utils.midpoint('', null)).toEqual('V');
    expect(utils.midpoint('V', null)).toEqual('l');
    expect(utils.midpoint('l', null)).toEqual('t');
    expect(utils.midpoint('t', null)).toEqual('x');
    expect(utils.midpoint('x', null)).toEqual('z');
    expect(utils.midpoint('z', null)).toEqual('zV');
    expect(utils.midpoint('zV', null)).toEqual('zl');
    expect(utils.midpoint('zl', null)).toEqual('zt');
    expect(utils.midpoint('zt', null)).toEqual('zx');
    expect(utils.midpoint('zx', null)).toEqual('zz');
    expect(utils.midpoint('zz', null)).toEqual('zzV');
    expect(utils.midpoint('1', '2')).toEqual('1V');
    expect(utils.midpoint('001', '001002')).toEqual('001001');
    expect(utils.midpoint('001', '001001')).toEqual('001000V');
    expect(utils.midpoint('', 'V')).toEqual('G');
    expect(utils.midpoint('', 'G')).toEqual('8');
    expect(utils.midpoint('', '8')).toEqual('4');
    expect(utils.midpoint('', '4')).toEqual('2');
    expect(utils.midpoint('', '2')).toEqual('1');
    expect(utils.midpoint('', '1')).toEqual('0V');
    expect(utils.midpoint('0V', '1')).toEqual('0l');
    expect(utils.midpoint('', '0G')).toEqual('08');
    expect(utils.midpoint('', '08')).toEqual('04');
    expect(utils.midpoint('', '02')).toEqual('01');
    expect(utils.midpoint('', '01')).toEqual('00V');
    expect(utils.midpoint('4zz', '5')).toEqual('4zzV');

    expect(function () {
      utils.midpoint('2', '1');
    }).toThrowError();

    expect(function () {
      utils.midpoint('', '');
    }).toThrowError();

    expect(function () {
      utils.midpoint('0', '1');
    }).toThrowError();

    expect(function () {
      utils.midpoint('1', '10');
    }).toThrowError();

    expect(function () {
      utils.midpoint('11', '1');
    }).toThrowError();
  });

  it('generates an new index between 2 indexes', () => {
    expect(utils.generateIndexBetween(null, null)).toEqual('a0');
    expect(utils.generateIndexBetween(null, 'a0')).toEqual('Zz');
    expect(utils.generateIndexBetween('a0', null)).toEqual('a1');
    expect(utils.generateIndexBetween('a0', 'a1')).toEqual('a0V');
    expect(utils.generateIndexBetween('a0V', 'a1')).toEqual('a0l');
    expect(utils.generateIndexBetween('Zz', 'a0')).toEqual('ZzV');
    expect(utils.generateIndexBetween('Zz', 'a1')).toEqual('a0');
    expect(utils.generateIndexBetween(null, 'Y00')).toEqual('Xzzz');
    expect(utils.generateIndexBetween('bzz', null)).toEqual('c000');
    expect(utils.generateIndexBetween('a0', 'a0V')).toEqual('a0G');
    expect(utils.generateIndexBetween('a0', 'a0G')).toEqual('a08');
    expect(utils.generateIndexBetween('b125', 'b129')).toEqual('b127');
    expect(utils.generateIndexBetween('a0', 'a1V')).toEqual('a1');
    expect(utils.generateIndexBetween('Zz', 'a01')).toEqual('a0');
    expect(utils.generateIndexBetween(null, 'a0V')).toEqual('a0');
    expect(utils.generateIndexBetween(null, 'b999')).toEqual('b99');

    expect(utils.generateIndexBetween(null, 'A000000000000000000000000001')).toEqual(
      'A000000000000000000000000000V'
    );
    expect(utils.generateIndexBetween('zzzzzzzzzzzzzzzzzzzzzzzzzzy', null)).toEqual(
      'zzzzzzzzzzzzzzzzzzzzzzzzzzz'
    );
    expect(utils.generateIndexBetween('zzzzzzzzzzzzzzzzzzzzzzzzzzz', null)).toEqual(
      'zzzzzzzzzzzzzzzzzzzzzzzzzzzV'
    );

    expect(function () {
      utils.generateIndexBetween(null, 'A00000000000000000000000000');
    }).toThrowError();

    expect(function () {
      utils.generateIndexBetween('a00', null);
    }).toThrowError();

    expect(function () {
      utils.generateIndexBetween('a00', 'a1');
    }).toThrowError();

    expect(function () {
      utils.generateIndexBetween('0', '1');
    }).toThrowError();

    expect(function () {
      utils.generateIndexBetween('a1', 'a0');
    }).toThrowError();
  });

  it('generates N new indexes between 2 indexes', () => {
    expect(utils.generateNIndexesBetween('a0', 'a5', 4).join()).toEqual('a0G,a0V,a1,a2');
  });

  it('generateNIndexesBetween vs generateIndexBetween should be equivalent for a single index', () => {
    const a = utils.generateIndexBetween('a0', 'a1');
    const b = utils.generateNIndexesBetween('a0', 'a1', 1)[0];
    expect(a).toEqual(b);
  });
});
