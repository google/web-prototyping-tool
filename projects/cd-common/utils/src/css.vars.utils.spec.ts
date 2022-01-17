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

import consts from './css.spec.json';
import * as cd from 'cd-interfaces';
import * as utils from './css.vars.utils';

describe('CSS Var utils', () => {
  it('cssVarStringFromValue', () => {
    expect(utils.cssVarStringFromValue('test')).toBe('test');
    expect(utils.cssVarStringFromValue({ value: 'test' })).toBe('test');
    expect(utils.cssVarStringFromValue({ id: 'MyVar', value: 'foo' })).toBe(
      'var(--co-my-var, foo)'
    );
    expect(utils.cssVarStringFromValue({ id: 'MyVar' })).toBe('var(--co-my-var)');
  });

  it('generateCSSVarKey', () => {
    expect(utils.generateCSSVarKey('PrimaryLight')).toBe('--co-primary-light');
    expect(utils.generateCSSVarKey('PrimaryLight', '500')).toBe('--co-primary-light-500');
  });

  it('generateCSSVars', () => {
    const designSystem = consts.designSystem as cd.IDesignSystem;
    const cssVarsResult = consts.vars.generateCSSVars.result as cd.KeyValueTuple[];
    expect(utils.generateCSSVars(designSystem)).toEqual(cssVarsResult);
  });
});
