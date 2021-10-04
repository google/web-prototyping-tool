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

import * as utils from './dot-notation.utils';

describe('Dot notation utils', () => {
  it('Should merge two objects using dot notation', () => {
    const a = { foo: 'bar' } as any;
    const b = { lorem: 'ipsum' } as any;
    const merge = utils.mergeWithDotNotation(a, b);
    const expected = { foo: 'bar', lorem: 'ipsum' };
    console.log('MERGE RESULT', merge);
    expect(merge).toEqual(expected);
  });

  it('Should merge two objects using dot notation', () => {
    const a = { empty: {} } as any;
    const b = { lorem: 'ipsum' } as any;
    const merge = utils.mergeWithDotNotation(a, b);
    const expected = { empty: {}, lorem: 'ipsum' };
    expect(merge).toEqual(expected);
  });

  it('Should merge two objects containing an array of objects', () => {
    const a = { actions: [{ foo: 'bar' }] } as any;
    const b = { lorem: 'ipsum' } as any;
    const merge = utils.mergeWithDotNotation(a, b);
    const expected = { actions: [{ foo: 'bar' }], lorem: 'ipsum' };
    expect(merge).toEqual(expected);
  });

  it('Should merge nested properties into an empty object', () => {
    const a = { foo: {} } as any;
    const b = { foo: { bar: 'bar' } } as any;
    const merge = utils.mergeWithDotNotation(a, b);
    const expected = { foo: { bar: 'bar' } };
    expect(merge).toEqual(expected);
  });

  it('Should not override nested properties with an empty object', () => {
    const a = { foo: { bar: 'bar' } } as any;
    const b = { foo: {} } as any;
    const merge = utils.mergeWithDotNotation(a, b);
    const expected = { foo: { bar: 'bar' } };
    expect(merge).toEqual(expected);
  });

  it('Should remove null values', () => {
    const a = { foo: { bar: 'bar' } } as any;
    const b = { foo: null, lorem: 'ipsum' } as any;
    const merge = utils.mergeWithDotNotation(a, b);
    const expected = { lorem: 'ipsum' };
    expect(merge).toEqual(expected);
  });

  it('Should preserve parent of a filtered out null value', () => {
    const a = { foo: { bar: 'bar' } } as any;
    const b = { foo: { bar: null } } as any;
    const merge = utils.mergeWithDotNotation(a, b);
    const expected = { foo: {} };
    expect(merge).toEqual(expected);
  });

  it('Should perform complex null filtering', () => {
    const a = { foo: { bar: 'bar', biz: { lorem: 'ipsum', dolor: 'amet' } }, asdf: 'asdf' } as any;
    const b = { foo: { bar: 'bar', biz: null }, asdf: null } as any;
    const merge = utils.mergeWithDotNotation(a, b);
    const expected = { foo: { bar: 'bar' } };
    expect(merge).toEqual(expected);
  });
});
