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
import { getTodayAsISOString } from 'cd-common/utils';
import { TOOLTIP_CONFIG } from '../../shared';
import templateFunction, { DATE_OUTPUT_BINDING } from './datepicker.template';

const DATE_LABEL = 'Date';

export class MaterialDatePicker extends mat.MaterialFormField {
  title = 'Date Picker';
  icon = 'calendar_today';

  inputs: cd.IDatePickerInputs = {
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    required: false,
    hint: '',
    label: DATE_LABEL,
    value: getTodayAsISOString(),
    appearance: cd.MatInputAppearance.Outline,
  };

  properties: cd.IPropertyGroup[] = [
    mat.MAT_INPUT_VARIANT_SELECT,
    {
      children: [
        mat.MAT_COLOR_SELECT,
        mat.MAT_LABEL_TEXT,
        {
          name: consts.VALUE_ATTR,
          inputType: cd.PropertyInput.Date,
          label: DATE_LABEL,
        },
        mat.MAT_HINT,
        mat.MAT_DISABLED_CHECKBOX,
        mat.MAT_REQUIRED_CHECKBOX,
      ],
    },
    TOOLTIP_CONFIG,
  ];

  outputs: cd.IOutputProperty[] = [
    {
      eventName: DATE_OUTPUT_BINDING,
      label: 'Value change',
      icon: 'date_range',
      binding: consts.VALUE_ATTR,
      eventKey: consts.VALUE_ATTR,
      type: cd.OutputPropertyType.String,
    },
  ];

  template = templateFunction;

  // TODO: This is currently overridden by the custom template above.
  // It can be removed once we decide how to implement property ordering.
  children = [
    mat.MaterialLabel,
    {
      tagName: consts.INPUT_TAG,
      attrs: { matInput: true },
      properties: [
        { name: consts.VALUE_ATTR, label: DATE_LABEL, inputType: cd.PropertyInput.Date },
        mat.MAT_DISABLED_CHECKBOX,
        mat.MAT_REQUIRED_CHECKBOX,
      ],
      outputs: [
        {
          eventName: 'dateInput',
          label: 'Date change',
          icon: 'date_range',
          binding: consts.VALUE_ATTR,
          eventKey: consts.VALUE_ATTR,
        },
      ],
    },
    { tagName: 'mat-datepicker-toggle', attrs: { for: 'picker' } },
    { tagName: 'mat-datepicker', attrs: { '#picker': true } },
    mat.MaterialHint,
  ];
}
