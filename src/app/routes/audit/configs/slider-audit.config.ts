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
import { IAuditView } from './audit.config';

export const matSliderConfig: IAuditView = {
  title: 'Material Slider',
  elementType: cd.ElementEntitySubType.Slider,
  variants: [
    {
      title: 'Primary',
      subVariants: [
        {
          title: 'Default',
          inputs: {},
        },
        {
          title: 'Default zero value',
          inputs: {
            value: 0,
          },
        },
        {
          title: 'Default vertical',
          inputs: {
            vertical: true,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
          },
        },
        {
          title: 'Default drag label',
          inputs: {
            thumbLabel: true,
          },
        },
      ],
    },
    {
      title: 'Warn',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            color: 'warn',
          },
        },
        {
          title: 'Default zero value',
          inputs: {
            value: 0,
            color: 'warn',
          },
        },
        {
          title: 'Default vertical',
          inputs: {
            vertical: true,
            color: 'warn',
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            color: 'warn',
          },
        },
        {
          title: 'Default drag label',
          inputs: {
            thumbLabel: true,
            color: 'warn',
          },
        },
      ],
    },
    {
      title: 'Secondary',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            color: 'accent',
          },
        },
        {
          title: 'Default zero value',
          inputs: {
            value: 0,
            color: 'accent',
          },
        },
        {
          title: 'Default vertical',
          inputs: {
            vertical: true,
            color: 'accent',
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            color: 'accent',
          },
        },
        {
          title: 'Default drag label',
          inputs: {
            thumbLabel: true,
            color: 'accent',
          },
        },
      ],
    },
  ],
};
