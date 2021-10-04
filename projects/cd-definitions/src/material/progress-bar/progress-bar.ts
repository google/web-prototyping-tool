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
import { UnitTypes } from 'cd-metadata/units';
import { TOOLTIP_CONFIG } from '../../shared';

export const MAT_PROGRESS_BAR_VALUE: cd.IPropertyGroup = {
  name: consts.VALUE_ATTR,
  inputType: cd.PropertyInput.Range,
  label: 'Value',
  innerLabel: UnitTypes.Percent,
  min: 0,
  max: 100,
  dataBindable: true,
  coerceType: cd.CoerceValue.Number,
};

export class MaterialProgressBar extends mat.MaterialComponent {
  tagName = 'mat-progress-bar';
  wrapperTag = consts.DIV_TAG;
  title = 'Progress Bar';
  icon = '/assets/icons/progress-ico.svg';
  width = 200;

  inputs: cd.IProgressBarInputs = {
    color: mat.DEFAULT_THEME_COLOR,
    mode: cd.ProgressBarMode.Determinate,
    value: 50,
    bufferValue: 75,
  };

  properties: cd.IPropertyGroup[] = [
    {
      children: [
        mat.MAT_COLOR_SELECT,
        {
          name: consts.MODE_ATTR,
          inputType: cd.PropertyInput.Select,
          label: 'Mode',
          placeholder: 'Mode',
          menuData: [
            {
              title: 'Determinate',
              value: cd.ProgressBarMode.Determinate,
            },
            {
              title: 'Indeterminate',
              value: consts.INDETERMINATE_ATTR,
            },
            {
              title: 'Query',
              value: cd.ProgressBarMode.Query,
            },
            {
              title: 'Buffer',
              value: cd.ProgressBarMode.Buffer,
            },
          ],
        },
        {
          ...MAT_PROGRESS_BAR_VALUE,
          conditions: [
            {
              name: consts.MODE_ATTR,
              type: cd.PropConditionEquality.Equals,
              value: [cd.ProgressBarMode.Buffer, cd.ProgressBarMode.Determinate],
            },
          ],
        },
        {
          name: 'bufferValue',
          inputType: cd.PropertyInput.Range,
          conditions: [
            {
              name: consts.MODE_ATTR,
              type: cd.PropConditionEquality.Equals,
              value: cd.ProgressBarMode.Buffer,
            },
          ],
          label: 'Buffer',
          innerLabel: UnitTypes.Percent,
          min: 0,
          max: 100,
          dataBindable: true,
          coerceType: cd.CoerceValue.Number,
        },
      ],
    },
    TOOLTIP_CONFIG,
  ];
}
