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

import templateFunction, * as navTemplate from './auto-nav.template';
import { MaterialComponent } from '../material-shared';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

const enum NavItemInputName {
  Top = 'top',
  Site = 'site',
  NewTab = 'newTab',
  LinkType = 'linkType',
}

const NAV_TYPE_CONDITION: cd.PropertyCondition = {
  name: consts.TYPE_ATTR,
  type: cd.PropConditionEquality.Equals,
  value: cd.AutoNavItemType.Navigation,
};

const BOARD_SELECTED_CONDITIONS: cd.PropertyCondition[] = [
  NAV_TYPE_CONDITION,
  {
    name: NavItemInputName.LinkType,
    type: cd.PropConditionEquality.Equals,
    value: cd.AutoNavLinkType.Board,
  },
];

const URL_SELECTED_CONDITIONS: cd.PropertyCondition[] = [
  NAV_TYPE_CONDITION,
  {
    name: NavItemInputName.LinkType,
    type: cd.PropConditionEquality.Equals,
    value: cd.AutoNavLinkType.Url,
  },
];

const DYNAMIC_LIST_SCHEMA: cd.IPropertyGroup[] = [
  {
    children: [
      {
        // Don't display a value but we still need the defaultValue
        // inputType: cd.PropertyInput.Select,
        type: cd.PropertyType.AttributeGeneric,
        label: 'Type',
        name: consts.TYPE_ATTR,
        menuData: [
          { title: 'Link', value: cd.AutoNavItemType.Navigation },
          { title: 'Header', value: cd.AutoNavItemType.Header },
          { title: 'Divider', value: cd.AutoNavItemType.Divider },
        ],
        defaultValue: cd.AutoNavItemType.Navigation,
      },
      {
        inputType: cd.PropertyInput.Text,
        type: cd.PropertyType.AttributeGeneric,
        label: 'Label',
        name: consts.LABEL_ATTR,
        defaultValue: 'Nav item',
      },
      // TODO: Fix issue where the icon picker doesn't move to M immediately
      {
        label: 'Icon',
        name: consts.ICON_ATTR,
        inputType: cd.PropertyInput.Icon,
        type: cd.PropertyType.AttributeGeneric,
        optionsConfig: {
          // Only relevant option in this config is iconInputOptions.iconSizesAllowed
          // The rest are required to match type
          iconInputOptions: {
            iconSizesAllowed: [cd.IconSize.Medium],
          },
          supportsSelection: false,
          valueType: cd.GenericListValueType.String,
        },
        conditions: [NAV_TYPE_CONDITION],
      },
      {
        inputType: cd.PropertyInput.Toggle,
        type: cd.PropertyType.AttributeGeneric,
        label: 'Navigate to',
        name: NavItemInputName.LinkType,
        menuData: [
          { title: 'Board', value: cd.AutoNavLinkType.Board },
          { title: 'URL', value: cd.AutoNavLinkType.Url },
        ],
        defaultValue: cd.AutoNavLinkType.Board,
        conditions: [NAV_TYPE_CONDITION],
      },
      // BOARD ONLY
      {
        type: cd.PropertyType.AutoNavItemDestination,
        label: 'Destination',
        conditions: BOARD_SELECTED_CONDITIONS,
      },
      // URL ONLY
      {
        label: 'Destination',
        name: NavItemInputName.Site,
        inputType: cd.PropertyInput.Text,
        type: cd.PropertyType.AttributeGeneric,
        placeholder: 'http://www.google.com',
        conditions: URL_SELECTED_CONDITIONS,
      },

      // BOARD ONLY
      {
        label: 'Top',
        name: NavItemInputName.Top,
        inputType: cd.PropertyInput.Checkbox,
        type: cd.PropertyType.AttributeGeneric,
        help: { text: 'Navigation will occur from the parent of a portal or modal' },
        conditions: BOARD_SELECTED_CONDITIONS,
      },

      // URL ONLY
      {
        label: 'New Tab',
        name: NavItemInputName.NewTab,
        inputType: cd.PropertyInput.Checkbox,
        type: cd.PropertyType.AttributeGeneric,
        conditions: URL_SELECTED_CONDITIONS,
      },

      // BOTH
      {
        label: 'Disabled',
        name: consts.DISABLED_ATTR,
        type: cd.PropertyType.AttributeGeneric,
        inputType: cd.PropertyInput.Checkbox,
        conditions: [NAV_TYPE_CONDITION],
      },
    ],
  },
];

export class AutoNav extends MaterialComponent {
  title = 'Navigation';
  icon = 'menu';
  tagName = navTemplate.AUTO_NAV_TAG_NAME;
  width = 240;

  inputs: cd.IAutoNavInputs = {
    items: [
      {
        label: 'Nav Item 1',
        type: cd.AutoNavItemType.Navigation,
        linkType: cd.AutoNavLinkType.Board,
        icon: 'access_time',
      },
      {
        label: 'Nav Item 2',
        type: cd.AutoNavItemType.Navigation,
        linkType: cd.AutoNavLinkType.Board,
        icon: 'star_border',
      },
      {
        label: 'Nav Item 3',
        type: cd.AutoNavItemType.Navigation,
        linkType: cd.AutoNavLinkType.Board,
        icon: 'cloud',
      },
    ],
    selectedIndex: 0, // First
  };

  styles = {
    display: cd.Display.Grid,
    alignContent: cd.GridAlign.Start,
  };

  properties: cd.IPropertyGroup[] = [
    {
      children: [
        {
          name: consts.TARGET_ATTR,
          inputType: cd.PropertyInput.PortalSelect,
          label: 'Target',
          siblingTransformer: assignActivePortalRefFn,
          help: { text: 'Target a Portal instead of the current board (default)' },
        },
        {
          name: navTemplate.NAV_SMALL_ICONS,
          inputType: cd.PropertyInput.Toggle,
          label: 'Icon size',
          defaultValue: false,
          menuData: [
            { title: 'Default', value: false },
            { title: 'Small', value: true },
          ],
        },
      ],
    },
    {
      removePadding: true,
      children: [
        {
          type: cd.PropertyType.AttributeGeneric,
          inputType: cd.PropertyInput.DynamicList,
          label: 'Items',
          name: navTemplate.NAV_ITEMS_BINDING,
          bindingType: cd.BindingType.Property,
          schema: DYNAMIC_LIST_SCHEMA,
          siblingTransformer: transformPortalRefFn,
          optionsConfig: {
            listItemLabelModelKey: consts.LABEL_ATTR,
            valueType: cd.GenericListValueType.String,
            supportsSelection: true,
            supportsUniqueSelection: true,
          },
        },
      ],
    },
  ];

  template = templateFunction;

  outputs: cd.IOutputProperty[] = [
    {
      label: 'Selected index',
      icon: 'menu',
      binding: consts.SELECTED_INDEX_ATTR,
      defaultTrigger: true,
      type: cd.OutputPropertyType.Numeric,
    },
  ];
}

const generatePortalRefUpdate = (
  elementId: string,
  referenceId: string | null | undefined
): cd.IPropertiesUpdatePayload[] => {
  return [{ elementId, properties: { inputs: { referenceId } } }];
};

const transformPortalRefFn = (value: Partial<cd.IAutoNavInputs>, prop: cd.PropertyModel) => {
  const { inputs } = prop;
  if (!inputs) return [];
  const { items, target } = inputs as cd.IAutoNavInputs;
  const { selectedIndex } = value;
  if (!target || selectedIndex === undefined) return [];
  let referenceId = null;
  if (selectedIndex !== -1) {
    const item = items[selectedIndex];
    if (item.type !== cd.AutoNavItemType.Navigation || item.linkType !== cd.AutoNavLinkType.Board) {
      return [];
    }
    referenceId = item.referenceId;
  }
  // Create update payload for portal at referenceId
  return generatePortalRefUpdate(target, referenceId);
};

const isBoardNav = (item?: cd.IAutoNavItem): item is cd.IAutoNavItemBoard => {
  return (
    item !== undefined &&
    item.type === cd.AutoNavItemType.Navigation &&
    item.linkType === cd.AutoNavLinkType.Board
  );
};

const assignActivePortalRefFn = (value: string, prop: cd.PropertyModel) => {
  const inputs = prop.inputs as cd.IAutoNavInputs;
  const idx = inputs.selectedIndex || 0;
  const selectedItem = inputs.items[idx];
  if (!isBoardNav(selectedItem)) return [];
  const referenceId = selectedItem?.referenceId;
  if (!referenceId || !value) return [];
  return generatePortalRefUpdate(value, referenceId);
};
