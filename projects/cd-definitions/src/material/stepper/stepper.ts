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

import { SELECTED_INDEX_ATTR } from 'cd-common/consts';
import * as cd from 'cd-interfaces';
import * as mat from '../material-shared';

import templateFunction from './stepper.template';

const DIRECTION_BINDING = 'verticalStepper';

export class MaterialStepper extends mat.MaterialComponent {
  tagName = 'mat-stepper';
  title = 'Stepper';
  icon = '/assets/icons/step-ico.svg';
  width = 540;
  height = 360;

  inputs: cd.IStepperInputs = {
    selectedIndex: 0,
    labelPosition: 'end' as cd.StepperLabelPosition,
    verticalStepper: false,
    childPortals: [{ name: 'Step 1' }, { name: 'Step 2' }, { name: 'Step 3' }],
  };

  properties: cd.IPropertyGroup[] = [
    {
      children: [
        {
          name: DIRECTION_BINDING,
          inputType: cd.PropertyInput.Toggle,
          label: 'Direction',
          menuData: [
            { title: 'Vertical', value: true },
            { title: 'Horizontal', value: false },
          ],
        },
        {
          name: 'labelPosition',
          inputType: cd.PropertyInput.Toggle,
          label: 'Label',
          conditions: [
            {
              name: DIRECTION_BINDING,
              type: cd.PropConditionEquality.Equals,
              value: false,
            },
          ],
          menuData: [
            { title: 'Beside', value: 'end' },
            { title: 'Below', value: 'bottom' },
          ],
        },
      ],
    },
    {
      removePadding: true,
      children: [
        {
          type: cd.PropertyType.PortalList,
          label: 'Steps',
          optionsConfig: {
            supportsIcons: false,
            mustHaveSelection: true,
            supportsDisabled: false,
            supportsSelection: true,
            nameLabel: 'Step name',
            valueLabel: 'Contents',
            valueType: cd.GenericListValueType.Select,
            supportsValue: true,
          },
        },
      ],
    },
  ];

  outputs: cd.IOutputProperty[] = [
    {
      label: 'Step Index',
      icon: 'menu',
      binding: SELECTED_INDEX_ATTR,
      defaultTrigger: true,
      type: cd.OutputPropertyType.Numeric,
    },
  ];

  template = templateFunction;
}
