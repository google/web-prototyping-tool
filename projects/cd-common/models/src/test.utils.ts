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

import * as cd from 'cd-interfaces';
import prettier from 'prettier/standalone';
import parserHtml from 'prettier/parser-html';
import type { Options } from 'prettier';

const CHECK_LINE_LENGTH_MAX = 10;

const PRETTIER_HTML_OPTIONS: Options = {
  parser: 'html',
  plugins: [parserHtml],
  htmlWhitespaceSensitivity: 'ignore',
};

export const formatHtml = (html: string): string => {
  return prettier.format(html, PRETTIER_HTML_OPTIONS);
};

/** Determines the first line that is different between the 2 templates. */
export const compareLines = (template: string, expected: string) => {
  const templateLines = template.split('\n');
  const expectedLines = expected.split('\n');
  const greaterLineCount = Math.max(templateLines.length, expectedLines.length);

  for (let i = 0; i < greaterLineCount - 1; i++) {
    if (templateLines[i] !== expectedLines[i]) {
      expect(`Line Diff (${i + 1}): ${templateLines[i]}`).toEqual(`"${expectedLines[i]}"`);
      break;
    }
  }
};

/** Checks a components rendered template against the final expected template. */
export const checkTemplate = (
  component: cd.IComponent,
  expectedTemplate: string,
  isExport = false,
  inputs?: cd.IStringMap<any>
) => {
  let renderedTemplate: string;
  if (isExport) {
    renderedTemplate = component.template(cd.TemplateBuildMode.Simple, { inputs });
  } else {
    renderedTemplate = component.template(cd.TemplateBuildMode.Internal);
  }

  if (renderedTemplate !== expectedTemplate) {
    // For long templates, indicate which line differs
    if (
      renderedTemplate.length > CHECK_LINE_LENGTH_MAX ||
      expectedTemplate.length > CHECK_LINE_LENGTH_MAX
    ) {
      compareLines(formatHtml(renderedTemplate), formatHtml(expectedTemplate));
    } else {
      expect(formatHtml(renderedTemplate)).toEqual(formatHtml(expectedTemplate));
    }
  }
};

/** Checks a components exported rendered template against the final expected template. */
export const checkExportTemplate = (
  component: cd.IComponent,
  template: string,
  inputs?: cd.IStringMap<any>
) => {
  return checkTemplate(component, template, true, inputs);
};
