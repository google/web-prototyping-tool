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

import * as consts from 'cd-common/consts';
import { CdComponent } from 'cd-common/models';
import {
  BindingType,
  ComponentLibrary,
  PropertyType,
  PropertyGroupType,
  PropertyInput,
  Position,
  OutputPropertyType,
  IPropertyGroup,
} from 'cd-interfaces';

export class PrimitiveComponent extends CdComponent {
  library = ComponentLibrary.Primitive;
  preventResize = false;
}

// Style configs
export const POSITION_CONFIG = { type: PropertyType.StylePosition };
export const OPACITY_CONFIG = { type: PropertyType.StyleOpacity };
export const OVERFLOW_CONFIG = { type: PropertyType.StyleOverflow };
export const PADDING_CONFIG = { type: PropertyType.StylePadding };
export const BORDER_RADIUS_CONFIG = { type: PropertyType.StyleRadius };
export const IMAGE_SIZE_CONFIG = { type: PropertyType.ImageSize };

// Style configs, always grouped/standalone
export const BACKGROUND_CONFIG = { type: PropertyType.StyleBackground, standalone: true };
export const BORDER_CONFIG = { type: PropertyType.StyleBorder, standalone: true };
export const SHADOW_CONFIG = { type: PropertyType.StyleBoxShadow, standalone: true };

export const DEFAULT_PROP_CONFIG = [{ type: PropertyType.StyleSize }, POSITION_CONFIG];

export const INNER_LAYOUT_CONFIG: IPropertyGroup = {
  type: PropertyType.StyleInnerLayout,
  standalone: true,
};

export const MATERIAL_RIPPLE_CONFIG: IPropertyGroup = {
  label: 'Material Ripple',
  collapsed: true,
  autoExpand: true,
  groupType: consts.PropertyGroupType.Collapse,
  children: [
    {
      type: PropertyType.AttributeGeneric,
      inputType: PropertyInput.Checkbox,
      label: 'Enabled',
      name: consts.MAT_RIPPLE_ATTR,
    },
    {
      type: PropertyType.AttributeGeneric,
      inputType: PropertyInput.Checkbox,
      label: 'Centered',
      name: consts.MAT_RIPPLE_CENTERED_ATTR,
    },
  ],
};

const TOOLTIP_POSITION_MENU_DATA = Object.entries(Position).map(([key, value]) => ({
  id: key,
  title: key,
  value: value,
}));

export const TOOLTIP_CONFIG = {
  label: 'Tooltip',
  collapsed: true,
  autoExpand: true,
  groupType: PropertyGroupType.Collapse,
  children: [
    {
      name: consts.TOOLTIP_LABEL_ATTR,
      inputType: PropertyInput.Text,
      bindingType: BindingType.None,
      label: 'Label',
      placeholder: 'Label',
    },
    {
      name: consts.TOOLTIP_POSITION_ATTR,
      inputType: PropertyInput.Select,
      bindingType: BindingType.None,
      label: 'Position',
      placeholder: 'Position',
      menuData: TOOLTIP_POSITION_MENU_DATA,
    },
  ],
};

export const FOCUS_OUTPUT_EVENT = {
  eventName: consts.FOCUS_OUTPUT_BINDING,
  label: 'Focus',
  icon: consts.FOCUS_ACTION_ICON,
  binding: 'focus',
  type: OutputPropertyType.None,
};

export const BLUR_OUTPUT_EVENT = {
  eventName: consts.BLUR_OUTPUT_BINDING,
  label: 'Blur',
  icon: consts.BLUR_ACTION_ICON,
  binding: 'blur',
  type: OutputPropertyType.None,
};

export const VALUE_CHANGE_BINDING = 'valueChange';
