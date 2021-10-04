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
import { generateIDWithLength } from 'cd-utils/guid';
import { incrementedName, toCamelCase } from 'cd-utils/string';

const CSS_VAR_LINK = 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties';
const INPUTS_LINK = '';
const LEARN_MORE_TEXT = 'Learn more';

/**
 * Full list of inputTypes:
 *
 *  AutoComplete <PHASE TWO?> [List of options, Starting value]
 *  Checkbox [Starting value]
 *  Color [Starting color]
 *  Date <PHASE TWO?> [Starting value]
 *  Group <DONT INCLUDE>
 *  Icon [Starting value]
 *  List <PHASE TWO> [List model for each item, Starting set of items]
 *  Number [Starting value]
 *  Range [Min, Max, Starting value, Units?]
 *  Select <PHASE TWO> [List of options, Starting value]
 *  SelectGrid <PHASE TWO> (Used with buttons) [List of values to be shown in button form]
 *  Switch [Starting value]
 *  Text [Starting value]
 *  Toggle <PHASE TWO?> [Starting Value]
 */
export const INPUT_TYPES_MENU_DATA = [
  { title: 'Text', value: cd.PropertyInput.Text },
  { title: 'Textarea', value: cd.PropertyInput.TextArea },
  { title: 'Number', value: cd.PropertyInput.Number },
  { title: 'Checkbox', value: cd.PropertyInput.Checkbox },
  { title: 'Range', value: cd.PropertyInput.Range },
  { title: 'Color', value: cd.PropertyInput.Color },
  { title: 'Data', value: cd.PropertyInput.DatasetSelect },
];

export const INPUT_BINDING_TYPES_MENU_DATA = [
  { title: 'Property', value: cd.BindingType.Property },
  { title: 'Attribute', value: cd.BindingType.Attribute },
  { title: 'CSS Variable', value: cd.BindingType.CssVar },
  // TODO: Consider implementing Style/InnerText/InnerHtml
];

export const EVENT_PAYLOAD_TYPES_MENU_DATA = [
  { title: 'None', value: cd.OutputPropertyType.None },
  { title: 'Boolean', value: cd.OutputPropertyType.Boolean },
  { title: 'Numeric', value: cd.OutputPropertyType.Numeric },
  { title: 'String', value: cd.OutputPropertyType.String },
];

export const DEFAULT_NEW_INPUT: cd.IPropertyGroup = {
  name: 'myInput',
  type: cd.PropertyType.AttributeGeneric,
  bindingType: cd.BindingType.Property,
  inputType: cd.PropertyInput.Text,
  label: 'My input',
};

export const DEFAULT_NEW_OUTPUT: cd.IOutputProperty = {
  label: 'My event',
  icon: 'code',
  type: cd.OutputPropertyType.None,
  eventName: 'myEvent',
  eventKey: 'detail',
  binding: 'myEvent',
};

export const createNewDefaultInput = (
  currentInputs: cd.IPropertyGroup[] = []
): cd.IPropertyGroup => {
  const currentLabels = currentInputs.map((i) => i.label || '');
  const label = incrementedName(DEFAULT_NEW_INPUT.label as string, currentLabels);
  const name = toCamelCase(label);
  const id = generateIDWithLength();
  return { ...DEFAULT_NEW_INPUT, id, name, label };
};

export const createNewDefaultOutput = (
  currentOutputs: cd.IOutputProperty[] = []
): cd.IOutputProperty => {
  const currentLabels = currentOutputs.map((i) => i.label || '');
  const label = incrementedName(DEFAULT_NEW_OUTPUT.label as string, currentLabels);
  const eventName = toCamelCase(label);
  const binding = eventName;
  const id = generateIDWithLength();
  return { ...DEFAULT_NEW_OUTPUT, id, label, eventName, binding };
};

export const CC_LIGHT_BKG_COLOR = '#FFFFFF';
export const CC_LIGHT_GRAY_BKG_COLOR = '#EEEEEE';
export const CC_DARK_GRAY_BKG_COLOR = '#555555';
export const CC_DARK_BKG_COLOR = '#111111';

export const CC_BKG_MENU_ITEMS: cd.IMenuConfig[] = [
  { title: 'Light', value: CC_LIGHT_BKG_COLOR, color: CC_LIGHT_BKG_COLOR },
  { title: 'Light Gray', value: CC_LIGHT_GRAY_BKG_COLOR, color: CC_LIGHT_GRAY_BKG_COLOR },
  { title: 'Dark Gray', value: CC_DARK_GRAY_BKG_COLOR, color: CC_DARK_GRAY_BKG_COLOR },
  { title: 'Dark', value: CC_DARK_BKG_COLOR, color: CC_DARK_BKG_COLOR },
];

// Errors region
export const NO_INPUT_NAME_ERROR_TEXT: cd.IRichTooltip = {
  text: `Input name is required.`,
  linkText: LEARN_MORE_TEXT,
  link: INPUTS_LINK,
};

export const NO_CSS_VAR_NAME_ERROR_TEXT: cd.IRichTooltip = {
  text: `CSS variable name is required.`,
  linkText: LEARN_MORE_TEXT,
  link: CSS_VAR_LINK,
};

export const DATA_BOUND_TO_ATTRIBUTE_ERROR_TEXT: cd.IRichTooltip = {
  text: `Invalid configuration. Data cannot be set on an attribute.`,
  linkText: LEARN_MORE_TEXT,
  link: INPUTS_LINK,
};

export enum NameErrorType {
  Input = 'Input',
  Event = 'Event',
  CssVar = 'CSS Variable',
}

export const getDuplicateNameErrorText = (
  duplicatedName: string,
  type: NameErrorType
): cd.IRichTooltip => {
  return {
    text: `${type} name must be unique. '${duplicatedName}' has already been used as an input or event name.`,
    linkText: LEARN_MORE_TEXT,
    link: INPUTS_LINK,
  };
};

export const getInvalidNameErrorText = (name: string, type: NameErrorType): cd.IRichTooltip => {
  const isCssVar = type === NameErrorType.CssVar;
  return {
    text: `
      '${name}' is not a valid ${type} name
      <br>
      <ul style="padding-left: var(--cd-spacing-5);">
        ${isCssVar ? '<li>Must start with "--"</li>' : '<li>Must start with a letter</li>'}
        <li>Only letters, numbers, hyphens, and underscores allowed</li>
      </ul>
    `,
    linkText: LEARN_MORE_TEXT,
    link: isCssVar ? CSS_VAR_LINK : INPUTS_LINK,
  };
};

export const INPUT_TYPE_LINK = '';

export const INPUT_TYPE_TEXT = `
  <ul>
    <li>Attributes are values on HTML tags</li>
    <li>Properties are values on element objects</li>
    <li>CSS variables are custom properties for styles</li>
  </ul>
  <a href="${INPUT_TYPE_LINK}">Learn more</a>
`;

export const INPUT_CSS_NAME_TEXT = 'The CSS variable name<br>Example: --foo-bar';
export const INPUT_PROP_ATTR_NAME_TEXT = 'Property or attribute name';
