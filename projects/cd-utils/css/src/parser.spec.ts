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
import { parseCss } from './parser';

const testParse = (name: string, cssText: string, values: IStringMap<string>) => {
  it(name, () => {
    const parsed = parseCss(cssText);
    expect(Object.keys(parsed).length).toBe(Object.keys(values).length);
    Object.keys(parsed).forEach((key: string) => {
      expect(values[key]).not.toBeUndefined();
      expect(values[key]).not.toBeNull();
      // Remove any breaks, tabs, or multiple spaces, to match the parser
      values[key] = values[key].trim().replace(/\s{2,}/g, ' ');
      expect(values[key]).toBe(parsed[key]);
    });
  });
};

describe('CSS parser util', () => {
  testParse('Parses a single CSS rule', 'color: red', { color: 'red' });

  testParse('Parses out semicolons', 'color: red;', { color: 'red' });

  testParse('Parses multiple CSS rules', 'color: red; font-weight: bold', {
    color: 'red',
    'font-weight': 'bold',
  });

  testParse('Parses full CSS syntax', 'div {color: red}', { color: 'red' });

  testParse(
    'Parses full CSS syntax with multiple rules',
    'div {color: red} div2 {font-weight: bold; background-color: green;}',
    { color: 'red', 'font-weight': 'bold', 'background-color': 'green' }
  );

  testParse('Parses style tags', '<style>div {color: red}</style>', { color: 'red' });

  testParse('Parses CSS vars', 'background-image: var(--grid-background)', {
    'background-image': 'var(--grid-background)',
  });

  const COMPLEX_CSS_RULE = `
      linear-gradient(90deg,
        var(--grid-line-color) 0px, var(--grid-line-color) 0.5px, var(--grid-gap-color) 0.5px,
        var(--grid-gap-color) 9.5px, var(--grid-line-color) 9.5px, var(--grid-line-color) 10px),
      linear-gradient(0deg,
        var(--grid-line-color) 0px,
        var(--grid-line-color) 0.5px,
        var(--grid-gap-color) 0.5px,
        var(--grid-gap-color) 9.5px,
        var(--grid-line-color) 9.5px,
        var(--grid-line-color) 10px)
  `;

  testParse('Parses complex rules', `--grid-background: ${COMPLEX_CSS_RULE};`, {
    '--grid-background': COMPLEX_CSS_RULE,
  });

  testParse('Parses multi-part rules', 'background: red; padding: 0', {
    background: 'red',
    padding: '0px',
  });

  testParse(
    'Parses messy rules',
    `
      div {background:  red;
      font-weight: /* TEST */ bold  ;
        padding:
      0px;    }
    `,
    { background: 'red', 'font-weight': 'bold', padding: '0px' }
  );
});
