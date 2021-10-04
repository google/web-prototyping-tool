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
import templateFunction from './tabs.template';

export class MaterialTabs extends mat.MaterialComponent {
  tagName = 'mat-tab-group';
  title = 'Tabs';
  icon = 'tab';
  width = 540;
  height = 360;

  styles = { display: null }; // don't override display on tab group

  inputs: cd.ITabInputs = {
    color: mat.DEFAULT_THEME_COLOR,
    selectedIndex: 0,
    childPortals: [{ name: 'Tab 1' }, { name: 'Tab 2' }],
  };

  properties: cd.IPropertyGroup[] = [
    { children: [mat.MAT_COLOR_SELECT] },
    {
      removePadding: true,
      children: [
        {
          label: 'Tabs',
          type: cd.PropertyType.PortalList,
          optionsConfig: {
            supportsIcons: true,
            mustHaveSelection: true,
            supportsDisabled: true,
            supportsSelection: true,
            placeholder: 'Select a board...',
            nameLabel: 'Tab name',
            valueLabel: 'Contents',
            valueType: cd.GenericListValueType.Select,
            supportsValue: true,
          },
        },
      ],
    },
  ];

  template = templateFunction;
}
