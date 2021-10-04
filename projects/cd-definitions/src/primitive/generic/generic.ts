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
import customFunction from './generic.template';

export class Generic extends shared.PrimitiveComponent {
  tagName = consts.DIV_TAG;
  title = 'Element';
  icon = consts.LayerIcons.GenericElement;
  childrenAllowed = true;
  width = 100;
  height = 100;

  styles = {
    // Format required to work with background control
    background: [{ value: '#EEEEEE' }],
    display: cd.Display.Block,
    overflow: { x: cd.Overflow.Hidden, y: cd.Overflow.Hidden },
  };

  inputs: cd.IGenericInputs = {
    matRipple: false,
  };

  properties: cd.IPropertyGroup[] = [
    { children: [shared.PADDING_CONFIG, shared.BORDER_RADIUS_CONFIG] },
    { children: [shared.OPACITY_CONFIG, shared.OVERFLOW_CONFIG] },
    shared.INNER_LAYOUT_CONFIG,
    shared.BACKGROUND_CONFIG,
    shared.BORDER_CONFIG,
    shared.SHADOW_CONFIG,
    shared.TOOLTIP_CONFIG,
    shared.MATERIAL_RIPPLE_CONFIG,
  ];

  template = customFunction;
}
