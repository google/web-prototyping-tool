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
import { getComponent, CdComponent, createInstance, BASE_ELEMENT_INPUTS } from 'cd-common/models';
import { registerComponentDefinitions } from './public_api';
import { generateFrame } from 'cd-common/utils';

registerComponentDefinitions();

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
  const lesser = templateLines.length <= expectedLines.length ? templateLines : expectedLines;
  const greater = lesser === templateLines ? expectedLines : templateLines;
  for (let i = 1; i < lesser.length - 1; i++) {
    if (lesser[i] !== greater[i]) {
      expect(`Line Diff (${i + 1}): "${lesser[i - 1] + lesser[i] + lesser[i + 1]}"`).toEqual(
        `"${greater[i - 1] + greater[i] + greater[i + 1]}"`
      );
      break;
    }
  }
};

/** Automatically compares the internal/simple templates for a given entity. */
export const runTemplateTests = (
  type: cd.ComponentIdentity,
  internalTemplate?: string | null,
  simpleTemplate?: string | null,
  exportInputs?: Record<string, any>
) => {
  const component = getComponent(type);
  if (!component) throw Error(`Component ${type} not found`);
  const instance = createInstance(type, TEST_PROJECT, TEST_ID);

  describe(`${component.id} component`, () => {
    if (internalTemplate) {
      it('creates an internal template', () => {
        const template = formatHtml(component.template(cd.TemplateBuildMode.Internal, instance));
        const expected = formatHtml(internalTemplate);
        expect(template).toEqual(expected);
        if (template !== expected) {
          compareLines(template, expected);
        }
      });
    }

    if (simpleTemplate) {
      it('creates a simple template for export', () => {
        // Custom provided inputs
        if (exportInputs) {
          Object.keys(exportInputs).forEach((key: string) => {
            (instance.inputs as { [key: string]: any })[key] = exportInputs[key];
          });
        }

        const template = formatHtml(component.template(cd.TemplateBuildMode.Simple, instance));
        const expected = formatHtml(simpleTemplate);
        expect(template).toEqual(expected);
        if (template !== expected) {
          compareLines(template, expected);
        }
      });
    }
  });
};

const TEST_PROJECT = 'project-id';
const TEST_ID = 'test-id';

const BASE_STYLES = { position: cd.PositionType.Relative, display: cd.Display.Block, opacity: 1 };

/** Default set of values for an instance. */

const generateInstanceDefaults = (baseStyles: cd.IStringMap<any>): cd.IComponentInstance => {
  return {
    projectId: TEST_PROJECT,
    id: TEST_ID,
    name: '',
    actions: [],
    attrs: [],
    childIds: [],
    elementType: cd.ElementEntitySubType.Generic,
    frame: generateFrame(),
    metadata: {},
    rootId: '',
    showPreviewStyles: false,
    state: cd.State.Default,
    styles: {
      base: { style: baseStyles, overrides: [] },
    },
    type: cd.EntityType.Element,
    inputs: BASE_ELEMENT_INPUTS,
  };
};

export const runInstanceTests = (
  type: cd.ComponentIdentity,
  values: Partial<cd.IComponentInstance>,
  baseStyles: cd.IStringMap<any> = BASE_STYLES
) => {
  const component = getComponent(type) as CdComponent;
  const instance = createInstance(type, TEST_PROJECT, TEST_ID).build();

  describe(`${component.id} component`, () => {
    it('creates an instance', () => {
      // Auto-merge base styles/inputs
      if (values.styles) {
        values.styles.base = {
          style: {
            ...baseStyles,
            ...values.styles.base.style,
          },
          overrides: [],
        };
      }
      if (values.inputs) {
        values.inputs = { ...BASE_ELEMENT_INPUTS, ...values.inputs };
      }

      const allValues = { ...generateInstanceDefaults(baseStyles), ...values };
      expect(instance).toEqual(allValues);
    });
  });
};
