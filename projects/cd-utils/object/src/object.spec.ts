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

import { areObjectsEqual } from './public_api';

describe('ObjectUtils', () => {
  it('areObjectsEqual', () => {
    expect(areObjectsEqual({}, {})).toBeTruthy();
    expect(areObjectsEqual(undefined, {})).toBeFalsy();
    expect(areObjectsEqual(undefined, undefined)).toBeTruthy();
    expect(areObjectsEqual(null, undefined)).toBeFalsy();
    expect(areObjectsEqual(0, undefined)).toBeFalsy();
    expect(areObjectsEqual(0, 2)).toBeFalsy();
    expect(areObjectsEqual('b', 'a')).toBeFalsy();
    expect(areObjectsEqual('a', 'a')).toBeTruthy();
    expect(areObjectsEqual(['a', 'b', 'c'], ['a'])).toBeFalsy();
    expect(areObjectsEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBeTruthy();
    expect(areObjectsEqual({ foo: ['a', 'b', 'c'] }, { foo: ['a', 'b'] })).toBeFalsy();
    expect(areObjectsEqual(new Set(['foo', 'bar']), new Set(['foo', 'bar']))).toBeTruthy();
    expect(areObjectsEqual(new Set(['foo', 'baz']), new Set(['foo', 'bar']))).toBeFalsy();
    expect(
      areObjectsEqual(
        { ids: { foo: { bar: [] }, baz: { bar: [] } }, type: 'e' },
        { ids: { foo: { bar: [] } }, type: 'e' }
      )
    ).toBeFalsy();

    expect(
      areObjectsEqual(
        { ids: new Set(['foo', 'bar']), type: 'e' },
        { ids: new Set(['foo', 'bar']), type: 'e' }
      )
    ).toBeTruthy();

    expect(
      areObjectsEqual(
        { ids: new Set(['foo', 'bar', 'bazz']), type: 'e' },
        { ids: new Set(['foo', 'bar']), type: 'e' }
      )
    ).toBeFalsy();

    expect(
      areObjectsEqual(
        {
          ids: new Map([
            ['foo', 'bar'],
            ['bazz', 'bee'],
          ]),
          type: 'e',
        },
        {
          ids: new Map([
            ['foo', 'bar'],
            ['bazz', 'bee'],
            ['test', 'foo'],
          ]),
          type: 'e',
        }
      )
    ).toBeFalsy();
  });
});
