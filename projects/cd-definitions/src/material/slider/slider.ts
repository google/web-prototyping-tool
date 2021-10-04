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

const enum SliderRange {
  Min = 'min',
  Max = 'max',
  Step = 'step',
}

export const MAT_SLIDER_VALUE: cd.IPropertyGroup = {
  name: consts.VALUE_ATTR,
  inputType: cd.PropertyInput.Range,
  label: 'Value',
  min: 0,
  max: 100,
  step: 1,
  minBinding: SliderRange.Min,
  maxBinding: SliderRange.Max,
  stepBinding: SliderRange.Step,
  dataBindable: true,
  coerceType: cd.CoerceValue.Number,
};

export class MaterialSlider extends mat.MaterialComponent {
  tagName = 'mat-slider';
  wrapperTag = consts.DIV_TAG;
  title = 'Slider';
  icon = '/assets/icons/slider-ico.svg';
  inputs: cd.ISliderInputs = {
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    value: 35,
    thumbLabel: false,
    vertical: false,
    invert: false,
    min: 0,
    max: 100,
    step: 1,
  };

  properties: cd.IPropertyGroup[] = [
    { children: [mat.MAT_COLOR_SELECT] },
    {
      children: [
        MAT_SLIDER_VALUE,
        {
          inputType: cd.PropertyInput.Group,
          label: 'Range',
          children: [
            {
              name: SliderRange.Min,
              inputType: cd.PropertyInput.Number,
              bottomLabel: 'Min',
            },
            {
              name: SliderRange.Max,
              inputType: cd.PropertyInput.Number,
              bottomLabel: 'Max',
            },
            {
              name: SliderRange.Step,
              inputType: cd.PropertyInput.Number,
              bottomLabel: 'Step',
            },
          ],
        },
      ],
    },
    {
      children: [
        {
          name: 'thumbLabel',
          inputType: cd.PropertyInput.Checkbox,
          label: 'Drag label',
        },
        {
          name: 'vertical',
          inputType: cd.PropertyInput.Checkbox,
          label: 'Vertical',
        },
        {
          name: 'invert',
          inputType: cd.PropertyInput.Checkbox,
          label: 'Inverted',
        },
        mat.MAT_DISABLED_CHECKBOX,
      ],
    },
    TOOLTIP_CONFIG,
  ];

  outputs: cd.IOutputProperty[] = [
    {
      eventName: 'input',
      label: 'Value change',
      icon: '/assets/icons/input-ico.svg',
      binding: consts.VALUE_ATTR,
      eventKey: consts.VALUE_ATTR,
      type: cd.OutputPropertyType.Numeric,
    },
  ];
}
