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
import templateFunction from './embed.template';

export class Embed extends shared.PrimitiveComponent {
  tagName = consts.IFRAME_TAG;
  title = 'Embed';
  icon = 'web_asset';
  width = 650;
  height = 500;

  aliases = [cd.ElementEntitySubType.Map, cd.ElementEntitySubType.Video];

  styles = {
    background: [{ value: '#EEEEEE' }],
  };

  inputs: cd.IIFrameInputs = {
    src: consts.DEFAULT_IFRAME_URL,
    variant: cd.EmbedVariant.Default,
  };

  // TODO: Implement via BindingType.URL
  properties: cd.IPropertyGroup[] = [
    { type: cd.PropertyType.EmbedAttributes, standalone: true },
    shared.BACKGROUND_CONFIG,
    shared.BORDER_CONFIG,
  ];

  template = templateFunction;
}
