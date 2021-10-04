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

export const matButtonConfig: IAuditView = {
  title: 'Material Button',
  elementType: cd.ElementEntitySubType.Button,
  variants: [
    {
      title: 'Basic',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            variant: cd.ButtonVariant.Basic,
          },
        },
        {
          title: 'Default with icon',
          inputs: {
            variant: cd.ButtonVariant.Basic,
            iconName: 'local_florist',
          },
        },
        {
          title: 'Warn',
          inputs: {
            color: 'warn',
            variant: cd.ButtonVariant.Basic,
          },
        },
        {
          title: 'Warn with icon',
          inputs: {
            color: 'warn',
            variant: cd.ButtonVariant.Basic,
            iconName: 'local_florist',
          },
        },
        {
          title: 'Secondary',
          inputs: {
            color: 'accent',
            variant: cd.ButtonVariant.Basic,
          },
        },
        {
          title: 'Secondary with icon',
          inputs: {
            color: 'accent',
            variant: cd.ButtonVariant.Basic,
            iconName: 'local_florist',
          },
        },
      ],
    },
    {
      title: 'Raised',
      subVariants: [
        {
          title: 'Default',
          inputs: {},
        },
        {
          title: 'Default with icon',
          inputs: {
            iconName: 'local_florist',
          },
        },
        {
          title: 'Warn',
          inputs: {
            color: 'warn',
          },
        },
        {
          title: 'Warn with icon',
          inputs: {
            color: 'warn',
            iconName: 'local_florist',
          },
        },
        {
          title: 'Secondary',
          inputs: {
            color: 'accent',
          },
        },
        {
          title: 'Secondary with icon',
          inputs: {
            color: 'accent',
            iconName: 'local_florist',
          },
        },
      ],
    },
    {
      title: 'Stroked',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            variant: cd.ButtonVariant.Stroked,
          },
        },
        {
          title: 'Default with icon',
          inputs: {
            variant: cd.ButtonVariant.Stroked,
            iconName: 'local_florist',
          },
        },
        {
          title: 'Warn',
          inputs: {
            color: 'warn',
            variant: cd.ButtonVariant.Stroked,
          },
        },
        {
          title: 'Warn with icon',
          inputs: {
            color: 'warn',
            variant: cd.ButtonVariant.Stroked,
            iconName: 'local_florist',
          },
        },
        {
          title: 'Secondary',
          inputs: {
            color: 'accent',
            variant: cd.ButtonVariant.Stroked,
          },
        },
        {
          title: 'Secondary with icon',
          inputs: {
            color: 'accent',
            variant: cd.ButtonVariant.Stroked,
            iconName: 'local_florist',
          },
        },
      ],
    },
    {
      title: 'Fab',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            variant: cd.ButtonVariant.Fab,
            iconName: 'add',
          },
        },
        {
          title: 'Warn',
          inputs: {
            color: 'warn',
            variant: cd.ButtonVariant.Fab,
            iconName: 'add',
          },
        },
        {
          title: 'Secondary',
          inputs: {
            color: 'accent',
            variant: cd.ButtonVariant.Fab,
            iconName: 'add',
          },
        },
      ],
    },
    {
      title: 'Icon',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            variant: cd.ButtonVariant.Icon,
            iconName: 'local_florist',
          },
        },
        {
          title: 'Warn',
          inputs: {
            color: 'warn',
            variant: cd.ButtonVariant.Icon,
            iconName: 'local_florist',
          },
        },
        {
          title: 'Secondary',
          inputs: {
            color: 'accent',
            variant: cd.ButtonVariant.Icon,
            iconName: 'local_florist',
          },
        },
      ],
    },
    {
      title: 'Flat',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            variant: cd.ButtonVariant.Flat,
          },
        },
        {
          title: 'Default with icon',
          inputs: {
            variant: cd.ButtonVariant.Flat,
            iconName: 'local_florist',
          },
        },
        {
          title: 'Warn',
          inputs: {
            color: 'warn',
            variant: cd.ButtonVariant.Flat,
          },
        },
        {
          title: 'Warn with icon',
          inputs: {
            color: 'warn',
            variant: cd.ButtonVariant.Flat,
            iconName: 'local_florist',
          },
        },
        {
          title: 'Secondary',
          inputs: {
            color: 'accent',
            variant: cd.ButtonVariant.Flat,
          },
        },
        {
          title: 'Secondary with icon',
          inputs: {
            color: 'accent',
            variant: cd.ButtonVariant.Flat,
            iconName: 'local_florist',
          },
        },
      ],
    },
  ],
};
