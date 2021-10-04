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

import { IStringMap } from 'cd-interfaces';
import { compareData } from './data-compare.utils';

interface ITestComparison {
  remote: IStringMap<any>;
  local: IStringMap<any>;
  error: string;
}

const tests: ITestComparison[] = [
  {
    remote: { test: 'foo' },
    local: { test: 'bar' },
    error: '"test" value mismatch. Remote: foo, Local: bar',
  },
  {
    remote: { test: 'foo', test1: 1 },
    local: { test: 'foo', test1: 2 },
    error: '"test1" value mismatch. Remote: 1, Local: 2',
  },
  {
    remote: { test: 'foo' },
    local: { test: null },
    error: '"test" missing local value, Remote: foo, Local: null',
  },
  {
    remote: { test: 'foo', test1: 'bar' },
    local: { test: 'foo' },
    error: '"test1" missing local value, Remote: bar, Local: undefined',
  },
  {
    remote: { test: null },
    local: { test: 'foo' },
    error: '"test" missing remote value, Remote: null, Local: foo',
  },
  {
    remote: { test: 'foo' },
    local: { test: 'foo', test1: 'bar' },
    error: '"test1" missing remote value, Remote: undefined, Local: bar',
  },
  {
    remote: { test: 'foo' },
    local: { test: [] },
    error: '"test" missing local value, Remote: foo, Local: []',
  },
  {
    remote: { test: [] },
    local: { test: 'foo' },
    error: '"test" missing remote value, Remote: [], Local: foo',
  },
  {
    remote: { test: { foo: 1 } },
    local: { test: { foo: 2 } },
    error: '"test.foo" value mismatch. Remote: 1, Local: 2',
  },
  {
    remote: { test: { foo: 1 } },
    local: { test: { foo: undefined } },
    error: '"test.foo" missing local value, Remote: 1, Local: undefined',
  },
  {
    remote: { test: { foo: { bar: true } } },
    local: { test: { foo: { bar: false } } },
    error: '"test.foo.bar" value mismatch. Remote: true, Local: false',
  },
  {
    remote: { test: [1, 2, 3] },
    local: { test: [1, 2] },
    error: '"test" array mismatch. Remote: [1,2,3], Local: [1,2]',
  },
  {
    remote: { test: [1, 3, 2] },
    local: { test: [2, 1] },
    error: '"test" array mismatch. Remote: [1,2,3], Local: [1,2]',
  },
  {
    remote: { foo: { bar: [1, 3, 2] } },
    local: { foo: { bar: [1, 2] } },
    error: '"foo.bar" array mismatch. Remote: [1,2,3], Local: [1,2]',
  },
  {
    remote: { test: [{ id: 1 }] },
    local: { test: [] },
    error: '"test" missing local document with id: 1',
  },
  {
    remote: { test: [{ id: 1 }] },
    local: { test: [{ id: 2 }, { id: 1 }] },
    error: '"test" missing remote document with id: 2',
  },
  {
    remote: { test: [{ id: 1, val: 'a' }] },
    local: { test: [{ id: 1, val: 'b' }] },
    error: '"test[{id: 1}].val" value mismatch. Remote: a, Local: b',
  },
  {
    remote: { test: [{ id: 1, foo: [{ id: 2, val: 3 }] }] },
    local: { test: [{ id: 1, foo: [{ id: 2, val: 4 }] }] },
    error: '"test[{id: 1}].foo[{id: 2}].val" value mismatch. Remote: 3, Local: 4',
  },
];

describe('Data comparison utils', () => {
  it('detects data errors', () => {
    for (const test of tests) {
      const check = compareData(test.remote, test.local);
      expect(check.errors.length).toBe(1);
      expect(check.errors[0]).toBe(test.error);
    }
  });

  it('ignores value checks for certain fields', () => {
    const obj1 = { test: 'foo', updatedAt: 123, lastScreenshotTime: 456 };
    const obj2 = { test: 'foo', updatedAt: 789, lastScreenshotTime: 916 };
    const check = compareData(obj1, obj2);
    expect(check.errors.length).toBe(0);
    expect(check.isSynchronised).toBe(true);
  });

  it('detects correctly synced data, regardless of order, or empty value types', () => {
    const obj1 = {
      someInt: 123,
      test: {
        prop1: [1, 2, 3],
        prop2: 'test',
        prop3: [
          { id: 1, foo: 'bar' },
          { id: 2, foo: 'bar' },
        ],
        prop4: { inner: { property: ['a', 'b'] } },
      },
      foo: 'bar',
      baz: 'test',
      emptyArray: [],
      emptyValue: undefined,
      emptyValue1: [],
    };
    const obj2 = {
      baz: 'test',
      foo: 'bar',
      test: {
        prop4: { inner: { property: ['b', 'a'] } },
        prop1: [3, 2, 1],
        prop3: [
          { id: 1, foo: 'bar' },
          { foo: 'bar', id: 2 },
        ],
        prop2: 'test',
      },
      someInt: 123,
      emptyArray: [],
      emptyValue: null,
      emptyValue1: undefined,
    };
    const check = compareData(obj1, obj2);
    expect(check.errors.length).toBe(0);
    expect(check.isSynchronised).toBe(true);
  });
});
