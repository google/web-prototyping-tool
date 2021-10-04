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
import * as mat from '../material-shared';
import * as consts from 'cd-common/consts';
import templateFunction, {
  SMALL_ATTR,
  MULTIPLE_ATTR,
  BUTTON_UNSELECTED_EVENT,
  BUTTON_SELECTED_EVENT,
  VERTICAL_ATTR,
  BUTTONS_ATTR,
} from './toggle-button-group.template';

const SINGLE_SELECT_OPTIONS_CONFIG: cd.IGenericListConfig = {
  valueType: cd.GenericListValueType.String,
  allowEmptyLabel: true,
  supportsSelection: true,
  selectionIsValue: true,
  supportsUniqueSelection: true,
  mustHaveSelection: false,
  supportsMultiAndSingle: true,
};

const MULTI_SELECT_OPTIONS_CONFIG: cd.IGenericListConfig = {
  ...SINGLE_SELECT_OPTIONS_CONFIG,
  multiSelect: true,
  supportsUniqueSelection: false,
};

const BUTTONS: cd.IToggleButtonConfig[] = [
  { name: 'Button 1', value: 'btn1' },
  { name: 'Button 2', value: 'btn2' },
  { name: 'Button 3', value: 'btn3' },
];

const BUTTONS_SCHEMA: cd.IPropertyGroup[] = [
  {
    children: [
      {
        label: 'Label',
        name: consts.NAME_ATTR,
        inputType: cd.PropertyInput.Text,
        type: cd.PropertyType.AttributeGeneric,
        defaultValue: 'Button',
      },
      {
        label: 'Icon',
        name: consts.ICON_ATTR,
        inputType: cd.PropertyInput.Icon,
        type: cd.PropertyType.AttributeGeneric,
      },
      {
        label: 'Tooltip',
        name: consts.TOOLTIP_LABEL_ATTR,
        inputType: cd.PropertyInput.Text,
        type: cd.PropertyType.AttributeGeneric,
      },
      {
        label: 'Disabled',
        name: consts.DISABLED_ATTR,
        inputType: cd.PropertyInput.Checkbox,
        type: cd.PropertyType.AttributeGeneric,
      },
    ],
  },
];

const BUTTONS_CONFIG = {
  type: cd.PropertyType.AttributeGeneric,
  inputType: cd.PropertyInput.DynamicList,
  label: 'Buttons',
  name: BUTTONS_ATTR,
  bindingType: cd.BindingType.Property,
  schema: BUTTONS_SCHEMA,
};

export class MaterialToggleButtonGroup extends mat.MaterialComponent {
  tagName = 'mat-toggle-button-group';
  title = 'Button Group';
  icon = '/assets/icons/btn-group.svg';
  fitContent = true;

  inputs: cd.IToggleButtonGroupInputs = {
    multiple: false,
    vertical: false,
    variant: cd.ButtonVariant.Basic,
    color: mat.DEFAULT_THEME_COLOR,
    small: false,
    disabled: false,
    value: BUTTONS[0].value,
    buttons: BUTTONS,
  };

  properties: cd.IPropertyGroup[] = [
    {
      children: [
        {
          name: consts.VARIANT_ATTR,
          inputType: cd.PropertyInput.Toggle,
          label: 'Variant',
          defaultValue: cd.ButtonVariant.Basic,
          menuData: [
            { title: 'Basic', value: cd.ButtonVariant.Basic },
            { title: 'Stroked', value: cd.ButtonVariant.Stroked },
          ],
        },
        mat.MAT_COLOR_SELECT,
        {
          name: MULTIPLE_ATTR,
          inputType: cd.PropertyInput.Toggle,
          propertyTransformer: transformMultipleFn,
          label: 'Select',
          defaultValue: false,
          menuData: [
            { title: 'Single', value: false },
            { title: 'Multi', value: true },
          ],
        },
      ],
    },
    {
      removePadding: true,
      children: [
        {
          ...BUTTONS_CONFIG,
          optionsConfig: MULTI_SELECT_OPTIONS_CONFIG,
          conditions: [
            {
              name: MULTIPLE_ATTR,
              type: cd.PropConditionEquality.Equals,
              value: true,
            },
          ],
        },
        {
          ...BUTTONS_CONFIG,
          optionsConfig: SINGLE_SELECT_OPTIONS_CONFIG,
          conditions: [
            {
              name: MULTIPLE_ATTR,
              type: cd.PropConditionEquality.Equals,
              value: false,
            },
          ],
        },
      ],
    },
    {
      children: [
        {
          name: VERTICAL_ATTR,
          inputType: cd.PropertyInput.Toggle,
          label: 'Orientation',
          defaultValue: false,
          menuData: [
            { title: 'Horizontal', value: false },
            { title: 'Vertical', value: true },
          ],
        },
        {
          name: SMALL_ATTR,
          label: 'Small',
          inputType: cd.PropertyInput.Checkbox,
          dataBindable: true,
          defaultValue: false,
          coerceType: cd.CoerceValue.Boolean,
        },
        mat.MAT_DISABLED_CHECKBOX,
      ],
    },
  ];

  outputs: cd.IOutputProperty[] = [
    {
      label: 'Button selected',
      defaultTrigger: true,
      icon: '/assets/icons/btn-group.svg',
      binding: BUTTON_SELECTED_EVENT,
      context: BUTTONS_ATTR,
      type: cd.OutputPropertyType.ListItemValue,
    },
    {
      label: 'Button unselected',
      icon: '/assets/icons/btn-group.svg',
      binding: BUTTON_UNSELECTED_EVENT,
      context: BUTTONS_ATTR,
      type: cd.OutputPropertyType.ListItemValue,
    },
    {
      label: 'Value change',
      icon: '/assets/icons/btn-group.svg',
      binding: consts.VALUE_ATTR,
      eventKey: consts.VALUE_ATTR,
      type: cd.OutputPropertyType.None,
      eventName: consts.CHANGE_OUTPUT_BINDING,
    },
  ];

  template = templateFunction;
}

/**
 * Transform group value when switching between single and multi mode.
 * single => multi will just keep the current selected,
 * multi => single should only keep the first selected item.
 */
const transformMultipleFn = (
  multiple: boolean,
  props: cd.PropertyModel
): Partial<cd.IToggleButtonGroupProperties> => {
  const inputs = { ...props.inputs } as cd.IToggleButtonGroupInputs;
  const inputValue = inputs.value || '';
  const groupValue = inputValue ? [inputValue] : [];
  const singleValue = Array.isArray(inputValue) ? inputValue[0] : inputValue;
  const value = multiple ? groupValue : singleValue;
  return { inputs: { ...inputs, multiple, value } };
};
