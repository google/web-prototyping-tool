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

import type { IValue } from 'cd-interfaces';
import { valueFromIValue, iValueFromAny, validAttrForKeyValue } from './ivalue.utils';

describe('IValue utils', () => {
  it('valueFromIValue method', () => {
    let ivalue: IValue = { id: 'foo', value: 'red', index: 0 };
    expect(valueFromIValue(ivalue)).toBe('red');
    ivalue = { id: 'bar', value: 123, units: 'px' };
    expect(valueFromIValue(ivalue)).toBe(123);
    expect(valueFromIValue(null)).toBe(undefined);
    expect(valueFromIValue('test')).toBe('test');
  });

  it('iValueFromAny', () => {
    const ivalue: IValue = { id: 'foo', value: 'blue', index: 1, units: '%' };
    const obj = { ...ivalue, ...{ foo: 123, bar: 'test' } };
    expect(iValueFromAny(obj)).toEqual(ivalue);
    expect(iValueFromAny('test')).toEqual({ value: 'test' });
  });

  it('validAttrForKeyValue method', () => {
    const allowed = [
      { name: 'foo' }, // lowercase letters allowed
      { name: 'FOO' }, // uppercase letters allowed
      { name: ':foo:' }, // : allowed anywhere
      { name: '_foo_' }, // _ allowed anywhere
      { name: 'foo-foo' }, // - allowed (not start)
      { name: 'foo0' }, // num allowed (not start)
      { name: 'foo.foo' }, // . allowed (not start)
    ];
    const disallowed = [
      { name: 'foo ' }, // no space allowed
      { name: 'foo;' }, // no ; allowed
      { name: '-foo' }, // cannot start with -
      { name: '0foo' }, // cannot start with num
      { name: '.foo' }, // cannot start with .
    ];
    allowed.forEach((test) => expect(validAttrForKeyValue(test)).toBeTruthy());
    disallowed.forEach((test) => expect(validAttrForKeyValue(test)).toBeFalse());
  });
});
