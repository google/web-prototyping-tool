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
import { Portal } from '../../core/portal/portal';
import { BEFORE_AFTER_TOGGLE_MENU, LabelPositionMode, MaterialComponent } from '../material-shared';
import templateFunction from './expansion-panel.template';

const HIDE_TOGGLE_BINDING = 'hideToggle';

export class MaterialExpansionPanel extends MaterialComponent {
  tagName = 'mat-accordion';
  wrapperTag = consts.DIV_TAG;
  title = 'Expansion Panel';
  icon = 'keyboard_arrow_up';
  width = '100%';

  inputs: cd.IExpansionPanelInputs = {
    childPortals: [{ name: 'Panel 1' }, { name: 'Panel 2' }],
    displayMode: 'default',
    hideToggle: false,
    multi: true,
    togglePosition: LabelPositionMode.After,
  };

  properties: cd.IPropertyGroup[] = [
    {
      children: [
        {
          inputType: cd.PropertyInput.Toggle,
          label: 'Gutters',
          name: 'displayMode',
          menuData: [
            { title: 'Default', value: 'default' },
            { title: 'Flat', value: 'flat' },
          ],
        },
      ],
    },
    {
      children: [
        {
          name: HIDE_TOGGLE_BINDING,
          inputType: cd.PropertyInput.Checkbox,
          label: 'Hide toggle',
        },
        {
          name: 'togglePosition',
          inputType: cd.PropertyInput.Toggle,
          label: 'Position',
          conditions: [
            {
              name: HIDE_TOGGLE_BINDING,
              type: cd.PropConditionEquality.Equals,
              value: false,
            },
          ],
          menuData: BEFORE_AFTER_TOGGLE_MENU,
        },
      ],
    },
    {
      removePadding: true,
      children: [
        {
          label: 'Panels',
          type: cd.PropertyType.PortalList,
          optionsConfig: {
            supportsIcons: false,
            mustHaveSelection: false,
            supportsDisabled: true,
            supportsSelection: true,
            nameLabel: 'Panel name',
            valueLabel: 'Contents',
            valueType: cd.GenericListValueType.Select,
            supportsValue: true,
            multiSelect: true,
          },
        },
      ],
    },
  ];

  template = templateFunction;

  // TODO: This is currently overridden by the custom template above.
  // It can be removed once we decide how to implement property ordering,
  // and once `bindFor` and context switching is fully implemented.
  children = [
    {
      tagName: 'mat-expansion-panel',
      bindFor: 'childPortals',
      properties: [
        { name: 'expanded', inputValue: consts.SELECTED_ATTR },
        { name: consts.DISABLED_ATTR },
      ],
      children: [
        {
          tagName: 'mat-expansion-panel-header',
          children: [
            {
              tagName: 'mat-expansion-title',
              binding: [
                {
                  name: consts.NAME_ATTR,
                  label: 'Panel Name',
                  bindingType: cd.BindingType.InnerText,
                },
              ],
            },
          ],
        },
        Portal,
      ],
    },
  ];
}
