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

/* eslint-disable max-lines */

import * as cd from 'cd-interfaces';
import { IAuditView } from './audit.config';

const DATE = new Date('1970-1-1');

export const matDatepickerConfig: IAuditView = {
  title: 'Material Date Picker',
  elementType: cd.ElementEntitySubType.Datepicker,
  variants: [
    {
      title: 'Standard',
      subVariants: [
        {
          title: 'Default',
          inputs: {
            value: DATE,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            value: DATE,
          },
        },
        {
          title: 'Default without date',
          inputs: {
            value: '',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: 'Sample hint!',
            value: DATE,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            value: DATE,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            value: DATE,
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
            value: DATE,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default without date',
          inputs: {
            value: '',
            color: 'warn',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: 'Sample hint!',
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            color: 'warn',
            value: DATE,
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
            value: DATE,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default without date',
          inputs: {
            value: '',
            color: 'accent',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: 'Sample hint!',
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            color: 'accent',
            value: DATE,
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
            value: DATE,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            appearance: cd.MatInputAppearance.Fill,
            value: DATE,
          },
        },
        {
          title: 'Default without date',
          inputs: {
            value: '',
            appearance: cd.MatInputAppearance.Fill,
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: 'Sample hint!',
            appearance: cd.MatInputAppearance.Fill,
            value: DATE,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            appearance: cd.MatInputAppearance.Fill,
            value: DATE,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            appearance: cd.MatInputAppearance.Fill,
            value: DATE,
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
            value: DATE,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            appearance: cd.MatInputAppearance.Fill,
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default without date',
          inputs: {
            value: '',
            appearance: cd.MatInputAppearance.Fill,
            color: 'warn',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: 'Sample hint!',
            appearance: cd.MatInputAppearance.Fill,
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            appearance: cd.MatInputAppearance.Fill,
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            appearance: cd.MatInputAppearance.Fill,
            color: 'warn',
            value: DATE,
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
            value: DATE,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            appearance: cd.MatInputAppearance.Fill,
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default without date',
          inputs: {
            value: '',
            appearance: cd.MatInputAppearance.Fill,
            color: 'accent',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: 'Sample hint!',
            appearance: cd.MatInputAppearance.Fill,
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            appearance: cd.MatInputAppearance.Fill,
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            appearance: cd.MatInputAppearance.Fill,
            color: 'accent',
            value: DATE,
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
            value: DATE,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            appearance: cd.MatInputAppearance.Outline,
            value: DATE,
          },
        },
        {
          title: 'Default without date',
          inputs: {
            value: '',
            appearance: cd.MatInputAppearance.Outline,
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: 'Sample hint!',
            appearance: cd.MatInputAppearance.Outline,
            value: DATE,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            appearance: cd.MatInputAppearance.Outline,
            value: DATE,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            appearance: cd.MatInputAppearance.Outline,
            value: DATE,
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
            appearance: cd.MatInputAppearance.Outline,
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            appearance: cd.MatInputAppearance.Outline,
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default without date',
          inputs: {
            value: '',
            appearance: cd.MatInputAppearance.Outline,
            color: 'warn',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: 'Sample hint!',
            appearance: cd.MatInputAppearance.Outline,
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            appearance: cd.MatInputAppearance.Outline,
            color: 'warn',
            value: DATE,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            appearance: cd.MatInputAppearance.Outline,
            color: 'warn',
            value: DATE,
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
            appearance: cd.MatInputAppearance.Outline,
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default without label',
          inputs: {
            label: '',
            appearance: cd.MatInputAppearance.Outline,
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default without date',
          inputs: {
            value: '',
            appearance: cd.MatInputAppearance.Outline,
            color: 'accent',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: 'Sample hint!',
            appearance: cd.MatInputAppearance.Outline,
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
            appearance: cd.MatInputAppearance.Outline,
            color: 'accent',
            value: DATE,
          },
        },
        {
          title: 'Default required',
          inputs: {
            required: true,
            appearance: cd.MatInputAppearance.Outline,
            color: 'accent',
            value: DATE,
          },
        },
      ],
    },
  ],
};
