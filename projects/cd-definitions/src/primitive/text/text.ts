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
import * as shared from '../../shared';
import { TextType } from 'cd-themes';

export const DEFAULT_PADDING = 8;
export const DEFAULT_FONT = { id: TextType.Body1 };

export class Text extends shared.PrimitiveComponent {
  tagName = consts.SPAN_TAG;
  title = 'Text';
  icon = 'format_shapes';
  fitContent = true;

  styles = {
    font: DEFAULT_FONT,
    verticalAlign: cd.VerticalAlign.Top,
    padding: {
      top: DEFAULT_PADDING,
      left: DEFAULT_PADDING,
      bottom: DEFAULT_PADDING,
      right: DEFAULT_PADDING,
    },
    overflow: { x: cd.Overflow.Visible, y: cd.Overflow.Visible },
    display: cd.Display.Block,
  };

  inputs: cd.ITextInputs = {
    innerHTML: 'Text',
    // Also used by rich text input
    richText: true,
  };

  properties: cd.IPropertyGroup[] = [
    { children: [shared.PADDING_CONFIG, shared.BORDER_RADIUS_CONFIG] },
    { children: [shared.OPACITY_CONFIG, shared.OVERFLOW_CONFIG] },
    {
      label: 'Text',
      name: consts.INNER_HTML,
      bindingType: cd.BindingType.InnerHtml,
      inputType: cd.PropertyInput.RichText,
      dataBindable: true,
      coerceType: cd.CoerceValue.String,
    },
    { type: cd.PropertyType.StyleTypography },
    { type: cd.PropertyType.StyleText },
    { type: cd.PropertyType.TextAdvanced, groupType: cd.PropertyGroupType.Collapse },
    shared.TOOLTIP_CONFIG,
    shared.BACKGROUND_CONFIG,
    shared.BORDER_CONFIG,
    { label: 'Text Shadow', type: cd.PropertyType.StyleTextShadow, standalone: true },
  ];
}
