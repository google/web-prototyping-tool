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
import templateFunction from './select.template';
import { TOOLTIP_CONFIG } from '../../shared';

export class MaterialSelect extends mat.MaterialComponent {
  tagName = 'mat-select';
  title = 'Select';
  icon = '/assets/icons/select-ico.svg';
  width = 200;

  inputs: cd.ISelectInputs = {
    color: mat.DEFAULT_THEME_COLOR,
    label: mat.DEFAULT_LABEL_NAME,
    labelPosition: mat.DEFAULT_LABEL_POS,
    appearance: cd.MatInputAppearance.Outline,
    disabled: false,
    required: false,
    value: '1',
    options: mat.DEFAULT_MENU,
  };

  properties: cd.IPropertyGroup[] = [
    mat.MAT_INPUT_VARIANT_SELECT,
    {
      children: [
        mat.MAT_COLOR_SELECT,
        mat.MAT_LABEL_TEXT,
        mat.MAT_HINT,
        mat.MAT_DISABLED_CHECKBOX,
        mat.MAT_REQUIRED_CHECKBOX,
      ],
    },
    {
      removePadding: true,
      children: [
        {
          label: 'Options',
          type: cd.PropertyType.AttributeGeneric,
          inputType: cd.PropertyInput.List,
          name: 'options',
          optionsConfig: {
            supportsIcons: false,
            supportsValue: false,
            supportsSelection: true,
            selectionIsValue: true,
            supportsUniqueSelection: true,
            mustHaveSelection: false,
            supportsDisabled: true,
            valueType: cd.GenericListValueType.String,
          },
        },
      ],
    },
    TOOLTIP_CONFIG,
  ];

  outputs: cd.IOutputProperty[] = [
    {
      label: 'Select',
      defaultTrigger: true,
      icon: '/assets/icons/select-ico.svg',
      binding: consts.VALUE_ATTR,
      context: consts.OPTIONS_TAG,
      type: cd.OutputPropertyType.ListItemValue,
    },
  ];

  template = templateFunction;
}
