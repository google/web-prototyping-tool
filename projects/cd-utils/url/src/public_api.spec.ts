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

import { prefixUrlWithHTTPS } from './public_api';

// prettier-ignore
const TEST_URLS = [
  ['/google.com', 'https://google.com' ],
  ['//google.com', 'https://google.com' ],
  ['google.com', 'https://google.com'],
]

describe('URLTests', () => {
  it('did process urls', () => {
    for (const test of TEST_URLS) {
      const [value, expected] = test;
      const modified = prefixUrlWithHTTPS(value);
      expect(modified).toEqual(expected);
    }
  });
});
