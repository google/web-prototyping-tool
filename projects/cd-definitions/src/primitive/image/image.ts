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
import templateFunction from './image.template';

export class Image extends shared.PrimitiveComponent {
  tagName = consts.IMG_TAG;
  title = 'Image';
  icon = 'drive_image';
  width = 220;
  height = 150;

  styles = {
    objectFit: cd.ObjectFit.Cover,
    display: cd.Display.Block,
  };

  inputs: cd.IImageInputs = {
    // This will default to the placeholder asset
    src: { id: null, value: '' } as cd.IValue,
  };

  // TODO: Implement via BindingType.Image
  properties: cd.IPropertyGroup[] = [
    { type: cd.PropertyType.StyleSize, children: [shared.IMAGE_SIZE_CONFIG] },
    { type: cd.PropertyType.StylePosition },
    { children: [shared.PADDING_CONFIG, shared.BORDER_RADIUS_CONFIG] },
    shared.OPACITY_CONFIG,
    { children: [{ type: cd.PropertyType.ImageSource }, { type: cd.PropertyType.ImageCrop }] },
    {
      label: 'Filter',
      collapsed: true,
      groupType: cd.PropertyGroupType.Collapse,
      type: cd.PropertyType.StyleFilter,
    },
    shared.TOOLTIP_CONFIG,
    shared.BORDER_CONFIG,
    shared.SHADOW_CONFIG,
  ];

  template = templateFunction;
}
