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

import type { Options } from 'prettier';
import prettier from 'prettier/standalone';
import parserHtml from 'prettier/parser-html';

const PRETTIER_HTML_OPTIONS: Options = {
  parser: 'html',
  plugins: [parserHtml],
  htmlWhitespaceSensitivity: 'ignore',
};

export const formatHTML = (html: string): string => {
  return prettier.format(html, PRETTIER_HTML_OPTIONS);
};
