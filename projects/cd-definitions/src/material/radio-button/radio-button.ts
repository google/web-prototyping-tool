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
import { TOOLTIP_CONFIG, PADDING_CONFIG, INNER_LAYOUT_CONFIG } from '../../shared';
import templateFunction from './radio-button.template';

const RADIO_BUTTON_BINDING = 'radioButtons';
export const SPACING = 8;

export class MaterialRadioButton extends mat.MaterialComponent {
  tagName = 'mat-radio-group';
  title = 'Radio Button';
  icon = 'radio_button_checked';

  styles = {
    padding: { top: SPACING, left: SPACING, bottom: SPACING, right: SPACING },
    gridRowGap: SPACING,
    display: cd.Display.Grid,
    gridAutoFlow: cd.GridAutoFlow.Row,
    gridAutoRows: cd.GridAutoMode.MinContent,
    alignContent: cd.GridAlign.Start,
    alignItems: cd.GridAlign.Start,
    gridColumnGap: 0,
  };

  inputs: cd.IRadioButtonGroupInputs = {
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    required: false,
    labelPosition: mat.DEFAULT_LABEL_POS,
    radioButtons: mat.DEFAULT_MENU,
  };

  properties: cd.IPropertyGroup[] = [
    { children: [PADDING_CONFIG] },
    INNER_LAYOUT_CONFIG,
    {
      children: [mat.MAT_COLOR_SELECT, mat.MAT_LABEL_POSITION, mat.MAT_DISABLED_CHECKBOX],
    },
    {
      removePadding: true,
      children: [
        {
          label: 'Options',
          inputType: cd.PropertyInput.List,
          name: RADIO_BUTTON_BINDING,
          optionsConfig: {
            supportsIcons: false,
            supportsValue: false,
            supportsSelection: true,
            supportsUniqueSelection: true,
            selectionIsValue: true,
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
      eventName: consts.CHANGE_OUTPUT_BINDING,
      defaultTrigger: true,
      label: 'Radio select',
      icon: 'radio_button_checked',
      binding: consts.VALUE_ATTR,
      eventKey: consts.VALUE_ATTR,
      context: RADIO_BUTTON_BINDING,
      type: cd.OutputPropertyType.ListItemValue,
    },
  ];

  template = templateFunction;
}
