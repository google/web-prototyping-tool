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
import * as utils from './css.transform.utils';
import * as cd from 'cd-interfaces';

describe('CSS Transform utils', () => {
  const { transform } = consts;
  const designSystem = consts.designSystem as cd.IDesignSystem;
  const bindings = transform.bindings as cd.IProjectBindings;
  const { extractColorForGradient, extractFontsFromStyle, extractBackgroundImage } = transform;

  it('designValueLookup', () => {
    const surfaceIValue = { id: 'Surface', value: '#FFFFFF' };
    const noIdIValue = { value: '#CCCCCC' };
    // Test that falling back to value works when it's not actually in the design system
    const wrongIdIValue = { id: 'Surface2', value: '#FFFFFF' };

    expect(utils.designValueLookup(surfaceIValue, designSystem)).toBe('var(--co-surface, #FFFFFF)');
    expect(utils.designValueLookup(noIdIValue, designSystem)).toBe('#CCCCCC');
    expect(utils.designValueLookup(wrongIdIValue, designSystem)).toBe('#FFFFFF');
  });

  it('extractColorForGradient', () => {
    const { startingStyles, endingStyles } = extractColorForGradient;
    expect(utils.extractColorForGradient(startingStyles, bindings)).toEqual(endingStyles);
  });

  it('extractFontsFromStyle', () => {
    const { startingStyles, endingStyles } = extractFontsFromStyle;
    expect(utils.extractFontsFromStyle(startingStyles, bindings)).toEqual(endingStyles);
  });

  it('extractBackgroundImage', () => {
    const { startingStyles, endingStyles } = extractBackgroundImage;
    expect(utils.extractBackgroundImage(startingStyles)).toEqual(endingStyles);
  });
});
