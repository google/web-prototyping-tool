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

import * as numericUtils from './public_api';

describe('NumericUtils', () => {
  it('converts number to base62', () => {
    expect(numericUtils.toBase62(0)).toEqual('0');
    expect(numericUtils.toBase62(62)).toEqual('10');
    expect(numericUtils.toBase62(124)).toEqual('20');

    const { BASE_62_CHARS } = numericUtils;
    const middleChar = BASE_62_CHARS[Math.floor(BASE_62_CHARS.length / 2)];
    expect(numericUtils.toBase62(31)).toEqual(middleChar);
  });
});
