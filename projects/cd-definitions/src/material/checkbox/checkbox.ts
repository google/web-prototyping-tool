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
import { TOOLTIP_CONFIG } from '../../shared';

export class MaterialCheckbox extends mat.MaterialComponent {
  tagName = 'mat-checkbox';
  wrapperTag = consts.DIV_TAG;
  title = 'Checkbox';
  icon = 'check_box';

  css = [{ name: mat.MAT_HAS_HINT_CLASS, binding: consts.HINT_ATTR }];

  inputs: cd.ICheckboxInputs = {
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    checked: false,
    label: mat.DEFAULT_LABEL_NAME,
    labelPosition: mat.DEFAULT_LABEL_POS,
  };

  children = [mat.MaterialLabel, mat.MaterialHint];

  properties: cd.IPropertyGroup[] = [
    {
      children: [
        mat.MAT_COLOR_SELECT,
        mat.MAT_LABEL_TEXT,
        mat.MAT_LABEL_POSITION,
        { ...mat.MAT_HINT, label: mat.MAT_HELPER_TEXT, placeholder: mat.MAT_HELPER_TEXT },
        mat.MAT_CHECKED,
        mat.MAT_DISABLED_CHECKBOX,
        {
          name: consts.INDETERMINATE_ATTR,
          inputType: cd.PropertyInput.Checkbox,
          label: 'Indeterminate',
        },
      ],
    },
    {
      removePadding: true,
      children: [
        {
          label: 'Children',
          type: cd.PropertyType.CheckboxChildren,
        },
      ],
    },
    TOOLTIP_CONFIG,
  ];

  outputs: cd.IOutputProperty[] = [
    {
      label: 'Checked',
      icon: 'check_box',
      defaultTrigger: true,
      eventName: consts.CHANGE_OUTPUT_BINDING,
      binding: consts.CHECKED_ATTR,
      eventKey: consts.CHECKED_ATTR,
      type: cd.OutputPropertyType.Boolean,
    },
  ];
}
