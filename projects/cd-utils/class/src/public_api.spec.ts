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

import { isClass, isOfClassType } from './public_api';

class X {}
class Y extends X {}
class Z extends Y {}
class A {}

describe('ClassUtils', () => {
  it('detects a class', () => {
    // True
    expect(isClass(X)).toBe(true);
    expect(isClass(Y)).toBe(true);
    expect(isClass(HTMLElement)).toBe(true);
    // False
    expect(isClass(function () {})).toBe(false);
    expect(isClass({})).toBe(false);
    expect(isClass(() => {})).toBe(false);
    expect(isClass('test')).toBe(false);
    expect(isClass(123)).toBe(false);
    expect(isClass(true)).toBe(false);
    expect(isClass(null)).toBe(false);
    expect(isClass(undefined)).toBe(false);
  });

  it('detects is type', () => {
    // True
    expect(isOfClassType(Y, X)).toBe(true);
    expect(isOfClassType(Z, Y)).toBe(true);
    expect(isOfClassType(Z, X)).toBe(true);
    expect(isOfClassType(X, X)).toBe(true);
    // False
    expect(isOfClassType(A, X)).toBe(false);
    expect(isOfClassType(X, Y)).toBe(false);
    expect(isOfClassType(X, Z)).toBe(false);
    expect(isOfClassType({}, X)).toBe(false);
    expect(isOfClassType(function () {}, X)).toBe(false);
  });
});
