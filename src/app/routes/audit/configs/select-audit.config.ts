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

export const matSelectConfig: IAuditView = {
  title: 'Material Select',
  elementType: cd.ElementEntitySubType.Select,
  variants: [
    {
      title: 'Standard',
      subVariants: [
        {
          title: 'Default',
          inputs: {},
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
          },
        },
        {
          title: 'Default without option selected',
          inputs: {
            selectedIndex: undefined,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
          },
        },
      ],
    },
    {
      title: 'Standard - Warn',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            color: 'warn',
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'warn',
          },
        },
        {
          title: 'Default without option selected',
          inputs: {
            selectedIndex: undefined,
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
          title: 'Default required',
          inputs: {
            required: true,
            color: 'warn',
          },
        },
      ],
    },
    {
      title: 'Standard - Secondary',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            color: 'accent',
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'accent',
          },
        },
        {
          title: 'Default without option selected',
          inputs: {
            selectedIndex: undefined,
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
          title: 'Default required',
          inputs: {
            required: true,
            color: 'accent',
          },
        },
      ],
    },
    {
      title: 'Fill',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            appearance: cd.MatInputAppearance.Fill,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            appearance: cd.MatInputAppearance.Fill,
          },
        },
        {
          title: 'Default without option selected',
          inputs: {
            selectedIndex: undefined,
            appearance: cd.MatInputAppearance.Fill,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            appearance: cd.MatInputAppearance.Fill,
            disabled: true,
          },
        },
        {
          title: 'Default required',
          inputs: {
            appearance: cd.MatInputAppearance.Fill,
            required: true,
          },
        },
      ],
    },
    {
      title: 'Fill - Warn',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            appearance: cd.MatInputAppearance.Fill,
            color: 'warn',
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'warn',
            appearance: cd.MatInputAppearance.Fill,
          },
        },
        {
          title: 'Default without option selected',
          inputs: {
            selectedIndex: undefined,
            color: 'warn',
            appearance: cd.MatInputAppearance.Fill,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            appearance: cd.MatInputAppearance.Fill,
            color: 'warn',
            disabled: true,
          },
        },
        {
          title: 'Default required',
          inputs: {
            appearance: cd.MatInputAppearance.Fill,
            color: 'warn',
            required: true,
          },
        },
      ],
    },
    {
      title: 'Fill - Secondary',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            appearance: cd.MatInputAppearance.Fill,
            color: 'accent',
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'accent',
            appearance: cd.MatInputAppearance.Fill,
          },
        },
        {
          title: 'Default without option selected',
          inputs: {
            selectedIndex: undefined,
            color: 'accent',
            appearance: cd.MatInputAppearance.Fill,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            appearance: cd.MatInputAppearance.Fill,
            color: 'accent',
            disabled: true,
          },
        },
        {
          title: 'Default required',
          inputs: {
            appearance: cd.MatInputAppearance.Fill,
            color: 'accent',
            required: true,
          },
        },
      ],
    },
    {
      title: 'Outline',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default without option selected',
          inputs: {
            selectedIndex: undefined,
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            appearance: cd.MatInputAppearance.Outline,
          },
        },
      ],
    },
    {
      title: 'Outline - Warn',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            color: 'warn',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'warn',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default without option selected',
          inputs: {
            selectedIndex: undefined,
            color: 'warn',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            color: 'warn',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            color: 'warn',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
      ],
    },
    {
      title: 'Outline - Secondary',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            color: 'accent',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'accent',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default without option selected',
          inputs: {
            selectedIndex: undefined,
            color: 'accent',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            color: 'accent',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            color: 'accent',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
      ],
    },
  ],
};
