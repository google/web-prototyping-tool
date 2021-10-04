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
import { wrapCodeComponentCode } from './code-component-bundle-wrapper';
import { stringMatchesRegex } from 'cd-utils/string';
import { createChangeMarker } from './change.utils';

export const DEFAULT_CODE_COMPONENT_FRAME: cd.ILockingRect = {
  x: 0,
  y: 0,
  width: 600,
  height: 400,
};

/**
 * Generate a tag name that appends id to prevent collisions when multiple code components have the same tag name
 */
export function getCodeComponentScopedTagName(codeComponentId: string, tagName: string): string {
  if (!codeComponentId) return tagName;
  return `${tagName}-${codeComponentId.toLowerCase()}`;
}

/**
 * Prepend and Append Javascript to file so that we can intercept calls to  customElements.define.
 * Our intercept will call:
 *
 * `_cdCustomElementDefineOverride` defined in projects/render-outlet/src/main.ts
 *
 * This will append the ID of the code component to the tag name of the custom element.
 */
export const addCustomElementDefineOverrideToJsBlob = async (
  codeComponentId: string,
  blob: Blob
): Promise<Blob> => {
  const blobText = await blob.text();
  const blobTextWrapped = wrapCodeComponentCode(codeComponentId, blobText);
  return new Blob([blobTextWrapped], { type: cd.FileMime.JS });
};

export const createCodeComponent = (
  id: string,
  projectId: string,
  title: string,
  tagName: string,
  jsBundleStoragePath: string
): cd.ICodeComponentDocument => {
  const type = cd.EntityType.CodeComponent;
  const changeMarker = createChangeMarker();

  const codeComponent: cd.ICodeComponentDocument = {
    id,
    projectId,
    changeMarker,
    type,
    title,
    tagName,
    jsBundleStoragePath,
    properties: [],
    icon: 'code',
    childrenAllowed: false,
    preventResize: false,
    fitContent: true,
    frame: DEFAULT_CODE_COMPONENT_FRAME,
  };
  return codeComponent;
};

export const getInstancesOfCodeComponent = (
  codeCmpId: string,
  elementProperties: cd.ElementPropertiesMap
): cd.ICodeComponentInstance[] => {
  const models = Object.values(elementProperties) as cd.IComponentInstance[];
  return models.filter((m) => m && m.elementType === codeCmpId) as cd.ICodeComponentInstance[];
};

export const mergeInputUpdatesIntoCodeComponentInstance = (
  newProperties: cd.IPropertyGroup[],
  currentInputs: cd.ICodeComponentInstanceInputs
): cd.ICodeComponentInstanceInputs => {
  return newProperties.reduce<cd.ICodeComponentInstanceInputs>(
    (acc, curr) => {
      const currInputs = currentInputs || {};

      const { name, defaultValue } = curr;
      if (!name) return acc;
      const currentValue = currInputs[name];
      const updatedValue = currentValue ?? defaultValue;

      // prevent ever setting undefined value
      if (updatedValue) acc[name] = updatedValue;

      return acc;
    },
    { ...currentInputs }
  );
};

/**
 * Test to ensure that custom element name is valid
 * https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
 */
const FORBIDDEN_NAMES = [
  'annotation-xml',
  'color-profile',
  'font-face',
  'font-face-src',
  'font-face-uri',
  'font-face-format',
  'font-face-name',
  'missing-glyph',
];

const CUSTOM_ELEMENT_NAME_REGEX = /^([a-z])+([a-z0-9._-])*-([a-z0-9._-])*$/;

const TAG_NAME_LENGTH_LIMIT = 50;

export const validateTagname = (tagName?: string): boolean => {
  if (!tagName) return false;
  if (tagName.length > TAG_NAME_LENGTH_LIMIT) return false;

  const forbidden = FORBIDDEN_NAMES.some((name) => name === tagName);
  if (forbidden) return false;

  return stringMatchesRegex(tagName, CUSTOM_ELEMENT_NAME_REGEX);
};

const NAME_REGEX = '([a-zA-Z])+([a-zA-Z0-9_-])*$';

/**
 * Attributes in HTML must start with a letter, and must only contain lowercase letters,
 * uppercase letters, numbers, underscores (_), periods (.), and hyphens (-)
 *
 * To prevent errors in our generated Angular template, all these characters will be allowed except
 * for periods (.)
 *
 * To provide consistency, all code component input and output names will validate using this regex
 */
const INPUT_OUTPUT_NAME_REGEX = `^${NAME_REGEX}`;

/**
 * CSS variables must be valid identifiers, proceeded by "--"
 * See identifiers: https://www.w3.org/TR/CSS22/syndata.html#value-def-identifier
 */
const CSS_VAR_NAME_REGEX = `^--${NAME_REGEX}`;

export const validateInputOutputName = (name: string): boolean => {
  return stringMatchesRegex(name, new RegExp(INPUT_OUTPUT_NAME_REGEX));
};

export const validateCssVarName = (name: string): boolean => {
  return stringMatchesRegex(name, new RegExp(CSS_VAR_NAME_REGEX));
};

/**
 * Verify if a new input or output name has not already been used
 */
export const checkIfDuplicateInputOutputName = (
  newName: string,
  inputs: ReadonlyArray<cd.IPropertyGroup> = [],
  outputs: ReadonlyArray<cd.IOutputProperty> = []
): boolean => {
  const inputNames = inputs ? inputs.map((i) => i.name) : [];
  const outputNames = outputs ? outputs.map((o) => o.eventName) : [];
  const nameSet = new Set([...inputNames, ...outputNames]);
  return nameSet.has(newName);
};
