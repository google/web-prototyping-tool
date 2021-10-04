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

// Hack for cd-utils/keycodes/src/keycodes.ts checking window.
// This is needed because the identifier "window" needs to be defined,
// or trying to test "!!window" would still produce error.
(global as any).window = undefined;

import { KEYS, Modifier as cduModifier } from 'cd-utils/keycodes';
import { capitalizeFirst } from 'cd-utils/string';

// Puppeteer wants modifier names' first character to be capitalized
// https://github.com/GoogleChrome/puppeteer/blob/master/lib/USKeyboardLayout.js
export const Modifier = Object.entries(cduModifier).reduce(
  (acc, [key, value]) => ({
    ...acc,
    [key]: capitalizeFirst(value),
  }),
  {} as { [k in keyof typeof cduModifier]: string }
);

export { KEYS };
