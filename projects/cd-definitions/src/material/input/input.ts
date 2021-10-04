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
import * as consts from 'cd-common/consts';
import * as mat from '../material-shared';
import { BLUR_OUTPUT_EVENT, FOCUS_OUTPUT_EVENT, TOOLTIP_CONFIG } from '../../shared';
import templateFunction, {
  INPUT_ROW_MAX,
  INPUT_ROW_MIN,
  INPUT_TYPE_ATTR,
  USE_CHIPS_ATTR,
} from './input.template';

export const DEFAULT_INPUT_TYPE = cd.MatInputFieldType.Text;

const NUM_FIELD_CONDITION = [
  {
    name: INPUT_TYPE_ATTR,
    type: cd.PropConditionEquality.Equals,
    value: cd.MatInputFieldType.Number,
  },
];

const STRING_FIELD_CONDITION = [
  {
    name: INPUT_TYPE_ATTR,
    type: cd.PropConditionEquality.NotEquals,
    value: cd.MatInputFieldType.Number,
  },
];

const IS_TEXTAREA_FIELD_CONDITION = [
  {
    name: consts.TYPE_ATTR,
    type: cd.PropConditionEquality.Equals,
    value: consts.TEXT_AREA_TAG,
  },
];

const IS_INPUT_FIELD_CONDITION = [
  {
    name: consts.TYPE_ATTR,
    type: cd.PropConditionEquality.Equals,
    value: consts.INPUT_TAG,
  },
];

export class MaterialInput extends mat.MaterialFormField {
  title = 'Material Input';
  icon = '/assets/icons/input-ico.svg';

  inputs: cd.IInputElementInputs = {
    type: consts.INPUT_TAG,
    inputType: DEFAULT_INPUT_TYPE,
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    required: false,
    placeholder: '',
    hint: '',
    value: '',
    label: mat.DEFAULT_LABEL_NAME,
    appearance: cd.MatInputAppearance.Outline,
    rowMin: 0,
    rowMax: 0,
    useChips: false,
  };

  properties: cd.IPropertyGroup[] = [
    {
      children: [
        {
          name: consts.TYPE_ATTR,
          inputType: cd.PropertyInput.Toggle,
          label: 'Kind',
          propertyTransformer: transformTypeFn,
          menuData: [
            { title: 'Input', value: consts.INPUT_TAG },
            { title: 'Textarea', value: consts.TEXT_AREA_TAG },
          ],
        },
        ...(mat.MAT_INPUT_VARIANT_SELECT.children as any),
      ],
    },
    {
      conditions: IS_TEXTAREA_FIELD_CONDITION,
      children: [{ ...mat.MAT_COLOR_SELECT }, { ...mat.MAT_LABEL_TEXT }],
    },
    {
      label: 'Value',
      conditions: IS_TEXTAREA_FIELD_CONDITION,
      children: [
        {
          ...mat.MAT_TEXT_VALUE,
          label: '',
          inputType: cd.PropertyInput.TextArea,
        },
      ],
    },
    {
      label: 'Placeholder',
      conditions: IS_TEXTAREA_FIELD_CONDITION,
      children: [
        {
          ...mat.MAT_PLACEHOLDER,
          label: '',
          inputType: cd.PropertyInput.TextArea,
        },
      ],
    },
    {
      children: [
        {
          name: INPUT_TYPE_ATTR,
          inputType: cd.PropertyInput.Select,
          label: 'Type',
          defaultValue: DEFAULT_INPUT_TYPE,
          menuData: [
            { value: cd.MatInputFieldType.Text, title: 'Text' },
            { value: cd.MatInputFieldType.Number, title: 'Number' },
            { value: cd.MatInputFieldType.Password, title: 'Password' },
          ],
          conditions: [
            {
              name: consts.TYPE_ATTR,
              type: cd.PropConditionEquality.Equals,
              value: consts.INPUT_TAG,
            },
          ],
        },
        { ...mat.MAT_COLOR_SELECT, conditions: IS_INPUT_FIELD_CONDITION },
        { ...mat.MAT_LABEL_TEXT, conditions: IS_INPUT_FIELD_CONDITION },
        {
          ...mat.MAT_TEXT_VALUE,
          conditions: [...STRING_FIELD_CONDITION, ...IS_INPUT_FIELD_CONDITION],
        },
        {
          ...mat.MAT_TEXT_VALUE,
          inputType: cd.PropertyInput.Number,
          coerceType: cd.CoerceValue.Number,
          conditions: [...NUM_FIELD_CONDITION, ...IS_INPUT_FIELD_CONDITION],
        },
        {
          ...mat.MAT_PLACEHOLDER,
          conditions: IS_INPUT_FIELD_CONDITION,
        },
        mat.MAT_HINT,
        {
          inputType: cd.PropertyInput.Group,
          label: 'Row Count',
          conditions: IS_TEXTAREA_FIELD_CONDITION,
          children: [
            {
              inputType: cd.PropertyInput.Number,
              name: INPUT_ROW_MIN,
              bottomLabel: 'Min',
              defaultValue: 0,
              min: 0,
              coerceType: cd.CoerceValue.Number,
              propertyTransformer: transformMinFn,
            },
            {
              name: INPUT_ROW_MAX,
              inputType: cd.PropertyInput.Number,
              bottomLabel: 'Max',
              defaultValue: 0,
              min: 0,
              coerceType: cd.CoerceValue.Number,
              propertyTransformer: transformMaxFn,
            },
          ],
        },
      ],
    },
    {
      children: [
        mat.MAT_DISABLED_CHECKBOX,
        mat.MAT_REQUIRED_CHECKBOX,
        {
          name: USE_CHIPS_ATTR,
          label: 'Chips',
          inputType: cd.PropertyInput.Checkbox,
          dataBindable: true,
          coerceType: cd.CoerceValue.Boolean,
          conditions: IS_INPUT_FIELD_CONDITION,
        },
      ],
    },
    {
      label: 'Suffix Icon',
      conditions: [
        { name: consts.TYPE_ATTR, type: cd.PropConditionEquality.Equals, value: consts.INPUT_TAG },
      ],
      children: [
        {
          name: consts.ICON_ATTR,
          inputType: cd.PropertyInput.Icon,
          label: 'Value',
        },
        {
          name: consts.ICON_TOOLTIP_LABEL_ATTR,
          inputType: cd.PropertyInput.Text,
          label: 'Tooltip',
          placeholder: 'Label',
          dataBindable: true,
          coerceType: cd.CoerceValue.String,
        },
      ],
    },
    TOOLTIP_CONFIG,
  ];

  outputs: cd.IOutputProperty[] = [
    {
      eventName: consts.CHANGE_OUTPUT_BINDING,
      label: 'Value change',
      icon: '/assets/icons/input-ico.svg',
      binding: consts.VALUE_ATTR,
      eventKey: consts.VALUE_ATTR,
      type: cd.OutputPropertyType.String,
    },
    FOCUS_OUTPUT_EVENT,
    BLUR_OUTPUT_EVENT,
  ];

  template = templateFunction;
}

/**
 * When the user changes the base input "type",
 * reset "inputType" to default and set "useChips" to false if textarea
 * */
const transformTypeFn = (type: string, props: cd.PropertyModel): Partial<cd.IInputProperties> => {
  const { useChips } = props.inputs as cd.IInputElementInputs;
  const shouldUseChips = type === consts.TEXT_AREA_TAG ? false : useChips;
  const inputs = { ...props.inputs, type } as cd.IInputElementInputs;
  const changes: Partial<cd.IInputProperties> = {};
  changes.inputs = { ...inputs, inputType: DEFAULT_INPUT_TYPE, useChips: shouldUseChips };
  return changes;
};

/** Prevent min on textarea from surpassing max */
const transformMinFn = (rowMin: number, props: cd.PropertyModel): Partial<cd.IInputProperties> => {
  const currentRowMax = (props.inputs as cd.IInputElementInputs).rowMax || 0;
  // only adjust if neither min/max is zero, and min exceeds max
  const skipAdjust = currentRowMax === 0 || rowMin === 0;
  const rowMax = !skipAdjust && currentRowMax < rowMin ? rowMin : currentRowMax;
  return updateMinMax(rowMin, rowMax, props);
};

/** Prevent max on textarea from being less than min */
const transformMaxFn = (rowMax: number, props: cd.PropertyModel): Partial<cd.IInputProperties> => {
  const currentRowMin = (props.inputs as cd.IInputElementInputs).rowMin || 0;
  // only adjust if neither min/max is zero, and min exceeds max
  const skipAdjust = rowMax === 0 || currentRowMin === 0;
  const rowMin = !skipAdjust && currentRowMin > rowMax ? rowMax : currentRowMin;
  return updateMinMax(rowMin, rowMax, props);
};

const updateMinMax = (
  rowMin: number,
  rowMax: number,
  props: cd.PropertyModel
): Partial<cd.IInputProperties> => {
  const inputs = { ...props.inputs, rowMin, rowMax } as cd.IInputElementInputs;
  const changes: Partial<cd.IInputProperties> = {};
  changes.inputs = { ...inputs };
  return changes;
};
