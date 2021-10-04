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
import { ICON_NAME_VALUE, LayerIcons, VARIANT_ATTR } from 'cd-common/consts';
import templateFunction, {
  SMALL_ATTR,
  ICON_RIGHT_SIDE_ATTR,
  SPLIT_ATTR,
  SPLIT_ICON,
} from './button.template';

const MENU_ATTR = 'menu';
const DEFAULT_FAB_ICON = 'add';
const DEFAULT_ICON = LayerIcons.Icon;
export const SPLIT_ICON_DEFAULT_VALUE = 'arrow_drop_down';

export class MaterialButton extends mat.MaterialComponent {
  tagName = 'mat-button';
  title = 'Button';
  icon = '/assets/icons/button-ico.svg';
  fitContent = true;

  inputs: cd.IButtonInputs = {
    color: mat.DEFAULT_THEME_COLOR,
    disabled: false,
    small: false,
    label: 'Button',
    variant: cd.ButtonVariant.Raised,
  };

  properties: cd.IPropertyGroup[] = [
    {
      label: 'Variants',
      groupType: cd.PropertyGroupType.Collapse,
      children: [
        {
          inputType: cd.PropertyInput.SelectGrid,
          name: VARIANT_ATTR,
          propertyTransformer: transformVariantFn,
          menuData: [
            { title: cd.ButtonVariant.Raised, value: cd.ButtonVariant.Raised },
            { title: cd.ButtonVariant.Basic, value: cd.ButtonVariant.Basic },
            { title: cd.ButtonVariant.Stroked, value: cd.ButtonVariant.Stroked },
            { title: cd.ButtonVariant.Flat, value: cd.ButtonVariant.Flat },
            { title: cd.ButtonVariant.Icon, value: cd.ButtonVariant.Icon },
            { title: cd.ButtonVariant.Fab, value: cd.ButtonVariant.Fab },
          ],
        },
      ],
    },
    {
      children: [
        mat.MAT_COLOR_SELECT,
        mat.MAT_LABEL_TEXT,
        mat.MAT_ICON,
        {
          name: ICON_RIGHT_SIDE_ATTR,
          label: 'Icon position',
          inputType: cd.PropertyInput.Toggle,
          menuData: [
            { title: 'Left', value: false },
            { title: 'Right', value: true },
          ],
          defaultValue: false,
          conditions: [
            {
              name: ICON_NAME_VALUE,
              type: cd.PropConditionExists.Exists,
            },
            {
              name: VARIANT_ATTR,
              type: cd.PropConditionEquality.NotEquals,
              value: [cd.ButtonVariant.Fab, cd.ButtonVariant.Icon],
            },
          ],
        },
        {
          name: SMALL_ATTR,
          label: 'Small',
          inputType: cd.PropertyInput.Checkbox,
          dataBindable: true,
          coerceType: cd.CoerceValue.Boolean,
        },
        mat.MAT_DISABLED_CHECKBOX,
      ],
    },
    {
      label: 'Menu',
      conditions: [
        {
          name: VARIANT_ATTR,
          type: cd.PropConditionEquality.NotEquals,
          value: [cd.ButtonVariant.Fab, cd.ButtonVariant.Icon],
        },
      ],
      children: [
        {
          name: SPLIT_ATTR,
          label: 'Type',
          propertyTransformer: transformSplitFn,
          inputType: cd.PropertyInput.Toggle,
          menuData: [
            { value: false, title: 'Default' },
            { value: true, title: 'Split' },
          ],
          defaultValue: false,
          dataBindable: true,
          coerceType: cd.CoerceValue.Boolean,
        },
        {
          name: SPLIT_ICON,
          inputType: cd.PropertyInput.Icon,
          label: 'Icon',
          conditions: [
            {
              name: SPLIT_ATTR,
              type: cd.PropConditionExists.Exists,
            },
          ],
        },
      ],
    },
    {
      removePadding: true,
      children: [
        {
          name: MENU_ATTR,
          label: 'Menu Items',
          inputType: cd.PropertyInput.List,
          optionsConfig: {
            supportsIcons: true,
            supportsValue: false,
            supportsSelection: false,
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
      label: 'Menu item click',
      icon: 'menu',
      binding: MENU_ATTR,
      context: MENU_ATTR,
      type: cd.OutputPropertyType.ListItemValue,
    },
  ];

  template = templateFunction;
}

/** When the user changes the button variant, add an icon and set frame locking */
const transformVariantFn = (
  variant: cd.ButtonVariant,
  props: cd.PropertyModel
): Partial<cd.IButtonProperties> => {
  const inputs = { ...props.inputs, variant } as cd.IButtonInputs;
  const changes: Partial<cd.IButtonProperties> = {};
  const isFab = variant === cd.ButtonVariant.Fab;
  const isIcon = variant === cd.ButtonVariant.Icon;
  const locked = isFab || isIcon;

  changes.frame = { locked } as cd.ILockingRect;
  if (!inputs.iconName && locked) {
    inputs.iconName = isFab ? DEFAULT_FAB_ICON : DEFAULT_ICON;
  }
  changes.inputs = { ...inputs };
  return changes;
};

/** When the user checks the split button, insert or remove the splitIcon */
const transformSplitFn = (
  split: boolean,
  props: cd.PropertyModel
): Partial<cd.IButtonProperties> => {
  const inputs = { ...props.inputs } as cd.IButtonInputs;
  const splitIcon = (split ? SPLIT_ICON_DEFAULT_VALUE : null) as cd.SelectedIcon; // null is needed to delete the property
  const menu = split ? (inputs?.menu?.length ? inputs.menu : [...mat.DEFAULT_MENU]) : inputs.menu; // if no menu, add a default list
  return { inputs: { ...inputs, split, splitIcon, menu } };
};
