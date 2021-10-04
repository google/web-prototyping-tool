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

/// <reference lib="webworker" />

import prettier from 'prettier/standalone';
import babelParser from 'prettier/parser-babel';
import type { Options } from 'prettier';

const PRETTIER_JSON_OPTIONS: Options = {
  parser: 'json',
  plugins: [babelParser],
  arrowParens: 'always',
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',
  insertPragma: false,
  printWidth: 80,
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  requirePragma: false,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  useTabs: false,
};

const PRETTIER_JS_OPTIONS: Options = {
  parser: 'babel',
  plugins: [babelParser],
  arrowParens: 'always',
  bracketSpacing: true,
  embeddedLanguageFormatting: 'auto',
  insertPragma: false,
  jsxBracketSameLine: false,
  jsxSingleQuote: false,
  printWidth: 80,
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  requirePragma: false,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: false,
};

const applyFormatting = (text: string, config: Options): string | false => {
  try {
    return prettier.format(text, config);
  } catch (e) {
    return false;
  }
};

addEventListener('message', ({ data }) => {
  try {
    const config = data.js ? PRETTIER_JS_OPTIONS : PRETTIER_JSON_OPTIONS;
    const formatted = applyFormatting(data.text, config);
    postMessage(formatted);
  } catch (e) {
    postMessage(false);
  }
});
