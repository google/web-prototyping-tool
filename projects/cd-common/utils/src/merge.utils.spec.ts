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

import consts from './merge.spec.json';
import * as cd from 'cd-interfaces';
import * as utils from './merge.utils';

describe('Merge utils', () => {
  const { mergeInstanceOverrides } = consts;

  it('mergeInstanceOverrides', () => {
    const { instance, elementProps } = mergeInstanceOverrides;
    const symbolInstance = instance as cd.ISymbolInstanceProperties;
    const propsMap = elementProps as cd.ElementPropertiesMap;
    const results = mergeInstanceOverrides.results as cd.ElementPropertiesMap;
    expect(utils.mergeInstanceOverrides(symbolInstance, propsMap)).toEqual(results);
  });
});
