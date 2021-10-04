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
import { UnitTypes } from 'cd-metadata/units';
import { TOOLTIP_CONFIG } from '../../shared';
import { MaterialComponent, MAT_COLOR_SELECT } from '../material-shared';

export class MaterialSpinner extends MaterialComponent {
  tagName = 'mat-progress-spinner';
  wrapperTag = consts.DIV_TAG;
  title = 'Spinner';
  icon = 'progress_activity';
  preventResize = true;

  properties: cd.IPropertyGroup[] = [
    {
      children: [
        {
          label: 'Mode',
          name: consts.MODE_ATTR,
          inputType: cd.PropertyInput.Toggle,
          fullWidth: true,
          defaultValue: cd.ProgressBarMode.Determinate,
          menuData: [
            { title: 'Determinate', value: cd.ProgressBarMode.Determinate },
            { title: 'Indeterminate', value: cd.ProgressBarMode.Indeterminate },
          ],
        },
      ],
    },
    {
      children: [
        MAT_COLOR_SELECT,
        {
          name: 'diameter',
          inputType: cd.PropertyInput.Range,
          label: 'Size',
          innerLabel: UnitTypes.Pixels,
          min: 12,
          max: 300,
          defaultValue: 36,
          dataBindable: true,
          coerceType: cd.CoerceValue.Number,
        },
        {
          name: 'strokeWidth',
          inputType: cd.PropertyInput.Range,
          label: 'Stroke',
          innerLabel: UnitTypes.Pixels,
          min: 1,
          max: 24,
          defaultValue: 2,
          dataBindable: true,
          coerceType: cd.CoerceValue.Number,
        },
        {
          name: consts.VALUE_ATTR,
          inputType: cd.PropertyInput.Range,
          conditions: [
            {
              name: consts.MODE_ATTR,
              type: cd.PropConditionEquality.Equals,
              value: cd.ProgressBarMode.Determinate,
            },
          ],
          label: 'Value',
          defaultValue: 65,
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
