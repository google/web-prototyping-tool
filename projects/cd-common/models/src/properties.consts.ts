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
import { ColorType } from 'cd-themes';
import { HIDDEN_ATTR } from 'cd-common/consts';

/**
 * This is used in multiple locations, to set the styles on the `Board` definition,
 * and to check if a screen shot is required in the screenshot service.
 */
export const DEFAULT_BOARD_STYLES = {
  base: {
    style: {
      position: cd.PositionType.Relative,
      display: cd.Display.Block,
      opacity: 1,
      background: [{ value: '#FFFFFF', id: ColorType.Surface }],
      overflow: { x: cd.Overflow.Hidden, y: cd.Overflow.Auto },
    },
  },
  overrides: [],
};

/** Auto-added to all properties. */
export const ADVANCED_CONFIG: cd.IPropertyGroup = {
  label: 'Advanced',
  collapsed: true,
  groupType: cd.PropertyGroupType.Collapse,
  autoExpand: true,
  autoExpandStyles: ['zIndex', 'cursor'],
  children: [{ type: cd.PropertyType.StyleAdvanced }],
};

export const HIDDEN_CONFIG: cd.IPropertyGroup = {
  children: [
    {
      name: HIDDEN_ATTR,
      label: 'Hidden',
      type: cd.PropertyType.AttributeGeneric,
      bindingType: cd.BindingType.None,
      inputType: cd.PropertyInput.Checkbox,
      dataBindable: true,
      coerceType: cd.CoerceValue.Boolean,
    },
  ],
};
