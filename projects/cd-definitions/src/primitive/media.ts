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
import * as shared from '../shared';
import { CSS_DISPLAY_NONE, SRC_ATTR, TYPE_ATTR } from 'cd-common/consts';

const VIDEO_SRC = '/assets/media/motion.mp4';
const AUDIO_SRC = '/assets/media/audio.mp3';

const CONTROLS_ATTR = 'controls';
const MUTED_ATTR = 'muted';
const AUTOPLAY_ATTR = 'autoplay';
const LOOP_ATTR = 'loop';

const enum MediaType {
  Audio = 'audio',
  Video = 'video',
}

export class Media extends shared.PrimitiveComponent {
  title = 'Media';
  icon = 'play_circle_filled';
  width = 480;

  styles = { outline: CSS_DISPLAY_NONE };

  properties: cd.IPropertyGroup[] = [
    shared.OPACITY_CONFIG,
    {
      children: [
        {
          label: 'Type',
          name: TYPE_ATTR,
          bindingType: cd.BindingType.TagName,
          inputType: cd.PropertyInput.Toggle,
          defaultValue: MediaType.Video,
          menuData: [
            { title: 'Video', value: MediaType.Video },
            { title: 'Audio', value: MediaType.Audio },
          ],
          // Update src, controls inputs
          propertyTransformer: (type: string, props: cd.PropertyModel) => {
            const src = type === MediaType.Video ? VIDEO_SRC : AUDIO_SRC;
            const controls = type === MediaType.Audio ? true : (props?.inputs as any).controls;
            const inputs = { ...props.inputs, src, type, controls };
            return { inputs } as Partial<cd.PropertyModel>;
          },
        },
      ],
    },
    {
      children: [
        {
          label: 'Source URL',
          bottomLabel: 'Defines the source URL for the media',
          placeholder: 'http://',
          inputType: cd.PropertyInput.Text,
          name: SRC_ATTR,
          bindingType: cd.BindingType.Attribute,
          defaultValue: VIDEO_SRC,
        },
        {
          label: 'Controls',
          name: CONTROLS_ATTR,
          inputType: cd.PropertyInput.Checkbox,
          bindingType: cd.BindingType.Attribute,
          defaultValue: true,
        },
        {
          label: 'Muted',
          name: MUTED_ATTR,
          bindingType: cd.BindingType.Attribute,
          inputType: cd.PropertyInput.Checkbox,
        },
        {
          label: 'Autoplay',
          name: AUTOPLAY_ATTR,
          bindingType: cd.BindingType.Attribute,
          inputType: cd.PropertyInput.Checkbox,
        },
        {
          label: 'Loop',
          name: LOOP_ATTR,
          bindingType: cd.BindingType.Attribute,
          inputType: cd.PropertyInput.Checkbox,
        },
      ],
    },
  ];

  audit = {
    autoGenerateSections: true,
    variantProperty: TYPE_ATTR,
    exclude: [SRC_ATTR],
  };
}
