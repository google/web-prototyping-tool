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
import * as utils from './css.utils';

describe('CSS utils', () => {
  const { main, transform } = consts;
  const designSystem = consts.designSystem as cd.IDesignSystem;
  const { generatedComputedCSS, styleForKey } = main;

  it('generateCSSVars', () => {
    const { styles } = generatedComputedCSS;
    const assets = generatedComputedCSS.assets as cd.IProjectAssets;
    const result = generatedComputedCSS.result as cd.IStyleList[];
    expect(utils.generateComputedCSS(styles, designSystem, assets)).toEqual(result);
  });

  it('styleForKey', () => {
    const { background, backgroundWrongId, display, borderTop } = styleForKey;
    const bindings = transform.bindings as cd.IProjectBindings;
    expect(utils.styleForKey(background.key, background.style, bindings)).toBe(background.result);
    // Intentionally use wrong ID, simulating a value from design system that is no longer there
    expect(utils.styleForKey(backgroundWrongId.key, backgroundWrongId.style, bindings)).toBe(
      backgroundWrongId.result
    );
    expect(utils.styleForKey(display.key, display.style, bindings)).toBe(display.result);
    expect(utils.styleForKey(display.key, null, bindings)).toBe('');
    expect(utils.styleForKey(borderTop.key, borderTop.style, bindings)).toBe(borderTop.result);
  });
});
