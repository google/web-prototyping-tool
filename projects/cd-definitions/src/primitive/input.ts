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

// prettier-ignore
import { DISABLED_ATTR, REQUIRED_ATTR, VALUE_ATTR, INPUT_BINDING, CURRENT_TARGET_BINDING, TYPE_ATTR, PLACEHOLDER_ATTR, VARIANT_ATTR } from 'cd-common/consts';
import { ColorType, ROBOTO_FONT } from 'cd-themes';
import { FontWeight } from 'cd-metadata/fonts';
import { UnitTypes } from 'cd-metadata/units';
import * as cd from 'cd-interfaces';
import * as shared from '../shared';

const SPELLCHECK_ATTR = 'spellcheck';
const DEFAULT_INPUT_TYPE = 'text';

enum ResizeTextArea {
  None = 'none',
  Both = 'both',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

enum InputType {
  Input = 'input',
  TextArea = 'textarea',
}

const INPUT_TYPE_MENU: cd.ISelectItem[] = [
  { value: DEFAULT_INPUT_TYPE, title: 'Text' },
  { value: 'number', title: 'Number' },
  { value: 'email', title: 'Email' },
  { value: 'date', title: 'Date' },
  { value: 'month', title: 'Month' },
  { value: 'week', title: 'Week' },
  { value: 'url', title: 'URL' },
  { value: 'file', title: 'File' },
  { value: 'color', title: 'Color' },
  { value: 'password', title: 'Password' },
  { value: 'range', title: 'Range' },
  { value: 'search', title: 'Search' },
  { value: 'tel', title: 'Telephone' },
  { value: 'time', title: 'Time' },
];

export const TEXT_PRIMITIVE_INPUT_VALUE: cd.IPropertyGroup = {
  label: 'Value',
  name: VALUE_ATTR,
  bindingType: cd.BindingType.Property,
  placeholder: 'Value',
  inputType: cd.PropertyInput.Text,
  defaultValue: '',
  variant: InputType.Input,
  dataBindable: true,
  coerceType: cd.CoerceValue.String,
};

export const TEXT_PRIMITIVE_PLACEHOLDER: cd.IPropertyGroup = {
  label: 'Placeholder',
  placeholder: 'Placeholder',
  name: PLACEHOLDER_ATTR,
  bindingType: cd.BindingType.Attribute,
  inputType: cd.PropertyInput.Text,
  defaultValue: '',
  variant: InputType.Input,
};

const RESIZE_MENU: cd.ISelectItem[] = [
  { title: 'Both', value: ResizeTextArea.Both },
  { title: 'None', value: ResizeTextArea.None },
  { title: 'Horizontal', value: ResizeTextArea.Horizontal },
  { title: 'Vertical', value: ResizeTextArea.Vertical },
];

const IS_TEXTAREA_FIELD_CONDITION = [
  {
    name: VARIANT_ATTR,
    type: cd.PropConditionEquality.Equals,
    value: InputType.TextArea,
  },
];

const IS_INPUT_FIELD_CONDITION = [
  {
    name: VARIANT_ATTR,
    type: cd.PropConditionEquality.Equals,
    value: InputType.Input,
  },
];

export class TextInput extends shared.PrimitiveComponent {
  title = 'Input';
  icon = '/assets/icons/input-ico.svg';

  css = ['co-input-primitive'];

  variants = {
    [InputType.Input]: { tagName: InputType.Input },
    [InputType.TextArea]: { tagName: InputType.TextArea },
  };

  styles = {
    border: {
      lineStyle: 'solid',
      borderWidth: 1,
      units: UnitTypes.Pixels,
      borderColor: { id: ColorType.Border, value: 'rgba(255,255,255,0.12)' },
    },
    font: {
      size: 14,
      color: { id: ColorType.Text, value: '#5F6368' },
      fontId: ROBOTO_FONT,
      index: 9,
      weight: FontWeight.Regular,
      lineHeight: 21,
      letterSpacing: 0.1,
    },
    borderRadius: { bottom: 4, top: 4, left: 4, right: 4 },
    padding: { right: 6, left: 6, top: 2, bottom: 2 },
  };

  properties: cd.IPropertyGroup[] = [
    {
      children: [{ type: cd.PropertyType.StylePadding }, { type: cd.PropertyType.StyleRadius }],
    },
    shared.OPACITY_CONFIG,
    {
      children: [
        {
          label: 'Kind',
          name: VARIANT_ATTR,
          bindingType: cd.BindingType.Variant,
          inputType: cd.PropertyInput.Toggle,
          defaultValue: InputType.Input,
          menuData: [
            { title: 'Input', value: InputType.Input },
            { title: 'Textarea', value: InputType.TextArea },
          ],
        },
      ],
    },
    {
      conditions: IS_INPUT_FIELD_CONDITION,
      children: [
        {
          label: 'Type',
          name: TYPE_ATTR,
          bindingType: cd.BindingType.Attribute,
          inputType: cd.PropertyInput.Select,
          defaultValue: DEFAULT_INPUT_TYPE,
          menuData: INPUT_TYPE_MENU,
          variant: InputType.Input,
        },
        TEXT_PRIMITIVE_INPUT_VALUE,
        TEXT_PRIMITIVE_PLACEHOLDER,
      ],
    },
    {
      label: 'Value',
      conditions: IS_TEXTAREA_FIELD_CONDITION,
      children: [
        {
          ...TEXT_PRIMITIVE_INPUT_VALUE,
          label: '',
          inputType: cd.PropertyInput.TextArea,
          bindingType: cd.BindingType.InnerText,
          variant: InputType.TextArea,
        },
      ],
    },
    {
      label: 'Placeholder',
      conditions: IS_TEXTAREA_FIELD_CONDITION,
      children: [
        {
          ...TEXT_PRIMITIVE_PLACEHOLDER,
          label: '',
          variant: InputType.TextArea,
          inputType: cd.PropertyInput.TextArea,
        },
      ],
    },
    {
      children: [
        {
          label: 'Resizable',
          name: 'resize',
          bindingType: cd.BindingType.Style,
          inputType: cd.PropertyInput.Select,
          defaultValue: ResizeTextArea.Both,
          menuData: RESIZE_MENU,
          variant: InputType.TextArea,
        },
        {
          label: 'Disabled',
          name: DISABLED_ATTR,
          bindingType: cd.BindingType.Attribute,
          inputType: cd.PropertyInput.Checkbox,
          dataBindable: true,
          coerceType: cd.CoerceValue.Boolean,
        },
        {
          label: 'Required',
          name: REQUIRED_ATTR,
          bindingType: cd.BindingType.Attribute,
          inputType: cd.PropertyInput.Checkbox,
          dataBindable: true,
          coerceType: cd.CoerceValue.Boolean,
        },
        {
          label: 'Spellcheck',
          name: SPELLCHECK_ATTR,
          bindingType: cd.BindingType.Attribute,
          inputType: cd.PropertyInput.Checkbox,
          // Spellcheck requires a "true" string value
          // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/spellcheck
          propertyTransformer: (value: boolean, props: cd.PropertyModel) => {
            const inputs = { ...props.inputs, [SPELLCHECK_ATTR]: value.toString() };
            return { inputs } as Partial<cd.PropertyModel>;
          },
        },
      ],
    },

    {
      label: 'Font',
      groupType: cd.PropertyGroupType.Collapse,
      collapsed: true,
      children: [{ type: cd.PropertyType.StyleTypography }],
    },
    shared.BORDER_CONFIG,
    shared.BACKGROUND_CONFIG,
  ];

  outputs: cd.IOutputProperty[] = [
    {
      label: 'Value change',
      icon: '/assets/icons/input-ico.svg',
      eventKey: `${CURRENT_TARGET_BINDING}?.${VALUE_ATTR}`,
      binding: VALUE_ATTR,
      eventName: INPUT_BINDING,
      type: cd.OutputPropertyType.String,
    },
    shared.FOCUS_OUTPUT_EVENT,
    shared.BLUR_OUTPUT_EVENT,
  ];

  audit = {
    autoGenerateSections: true,
    variantProperty: VARIANT_ATTR,
    columnWidth: 285,
  };
}
