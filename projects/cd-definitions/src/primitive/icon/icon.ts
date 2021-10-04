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
import * as utils from 'cd-common/utils';
import * as shared from '../../shared';
import { TextType, ColorType } from 'cd-themes';
import { UnitTypes } from 'cd-metadata/units';
import templateFunction from './icon.template';

export const ICON_SIZE = 24;

export class Icon extends shared.PrimitiveComponent {
  tagName = consts.ICON_ELEMENT_TAG;
  title = 'Icon';
  icon = consts.LayerIcons.Icon;
  width = ICON_SIZE;
  height = ICON_SIZE;
  resizeType = cd.ResizeType.Uniform;

  css = [consts.MATERIAL_ICONS_CLASS];

  styles = {
    color: { value: '#000000', id: ColorType.Text } as cd.IValue,
    display: cd.Display.InlineBlock,
    boxSizing: cd.BoxSizing.ContentBox,
    verticalAlign: cd.VerticalAlign.Top,
    fontSize: utils.generateIValue(24, UnitTypes.Pixels),
    fontFamily: { id: TextType.IconFontFamily },
  };

  inputs: cd.IIconInputs = { iconName: consts.LayerIcons.Icon };

  properties: cd.IPropertyGroup[] = [
    {
      name: consts.ICON_ATTR,
      inputName: consts.ICON_NAME_VALUE,
      type: cd.PropertyType.IconInput,
      bindingType: cd.BindingType.Property,
    },
    shared.OPACITY_CONFIG,
    shared.TOOLTIP_CONFIG,
  ];

  template = templateFunction;
}
