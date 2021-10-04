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

const HINT = 'This is a hint.';

export const matCheckboxConfig: IAuditView = {
  title: 'Material Checkbox',
  elementType: cd.ElementEntitySubType.Checkbox,
  variants: [
    {
      title: 'Primary',
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
          title: 'Default label before',
          inputs: {
            labelPosition: 'before',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: HINT,
          },
        },
        {
          title: 'Default label before with hint',
          inputs: {
            labelPosition: 'before',
            hint: HINT,
          },
        },
        {
          title: 'Default disabled',
          inputs: {
            disabled: true,
          },
        },
        {
          title: 'Default disabled with hint',
          inputs: {
            disabled: true,
            hint: HINT,
          },
        },
        {
          title: 'Default checked',
          inputs: {
            checked: true,
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
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'warn',
          },
        },
        {
          title: 'Default label before',
          inputs: {
            labelPosition: 'before',
            color: 'warn',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: HINT,
            color: 'warn',
          },
        },
        {
          title: 'Default label before with hint',
          inputs: {
            labelPosition: 'before',
            hint: HINT,
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
          title: 'Default disabled with hint',
          inputs: {
            disabled: true,
            hint: HINT,
            color: 'warm',
          },
        },
        {
          title: 'Default checked',
          inputs: {
            checked: true,
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
          title: 'Default without label',
          inputs: {
            label: '',
            color: 'accent',
          },
        },
        {
          title: 'Default label before',
          inputs: {
            labelPosition: 'before',
            color: 'accent',
          },
        },
        {
          title: 'Default with hint',
          inputs: {
            hint: HINT,
            color: 'accent',
          },
        },
        {
          title: 'Default label before with hint',
          inputs: {
            labelPosition: 'before',
            hint: HINT,
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
          title: 'Default disabled with hint',
          inputs: {
            disabled: true,
            hint: HINT,
            color: 'accent',
          },
        },
        {
          title: 'Default checked',
          inputs: {
            checked: true,
            color: 'accent',
          },
        },
      ],
    },
  ],
};
