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
import { TOOLTIP_CONFIG } from '../../shared';
import templateFunction, { CHIPS_ATTR } from './chips.template';

const CHIP_ICON = '/assets/icons/chips-ico.svg';

export class MaterialChips extends mat.MaterialComponent {
  tagName = 'mat-chip-list';
  title = 'Chips List';
  icon = CHIP_ICON;

  styles = {
    display: cd.Display.Block,
    position: cd.PositionType.Relative,
  };

  inputs: cd.IChipListInputs = {
    color: mat.DEFAULT_THEME_COLOR,
    chips: [
      { name: 'Chip 1', value: '1', selected: true },
      { name: 'Chip 2', value: '2' },
      { name: 'Chip 3', value: '3' },
    ],
  };

  properties: cd.IPropertyGroup[] = [
    { children: [mat.MAT_COLOR_SELECT] },
    {
      removePadding: true,
      children: [
        {
          name: CHIPS_ATTR,
          label: 'Options',
          inputType: cd.PropertyInput.List,
          optionsConfig: {
            supportsIcons: false,
            supportsValue: false,
            supportsSelection: true,
            supportsUniqueSelection: false,
            mustHaveSelection: false,
            supportsDisabled: true,
            multiSelect: true,
            valueType: cd.GenericListValueType.String,
          },
        },
      ],
    },
    TOOLTIP_CONFIG,
  ];

  outputs: cd.IOutputProperty[] = [
    {
      label: 'Chip click',
      icon: CHIP_ICON,
      binding: CHIPS_ATTR,
      context: CHIPS_ATTR,
      defaultTrigger: true,
      type: cd.OutputPropertyType.ListItemValue,
    },
  ];

  template = templateFunction;
}
