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

export const matRadiobuttonsConfig: IAuditView = {
  title: 'Material Radio Buttons',
  elementType: cd.ElementEntitySubType.RadioButtonGroup,
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
            radioButtons: [
              { name: '', value: '1' },
              { name: '', value: '2' },
              { name: '', value: '3' },
            ],
          },
        },
        {
          title: 'Default option checked',
          inputs: {
            selectedIndex: 1,
            radioButtons: [
              { name: 'Option 1', value: '1' },
              { name: 'Option 2', value: '2' },
              { name: 'Option 3', value: '3' },
            ],
          },
        },
        {
          title: 'Default option disabled',
          inputs: {
            radioButtons: [
              { name: 'Option 1', value: '1' },
              { name: 'Option 2', value: '2', disabled: true },
              { name: 'Option 3', value: '3' },
            ],
          },
        },
        {
          title: 'Default label before',
          inputs: {
            labelPosition: 'before',
          },
        },
        {
          title: 'Default all disabled',
          inputs: {
            disabled: true,
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
            color: 'warn',
            radioButtons: [
              { name: '', value: '1' },
              { name: '', value: '2' },
              { name: '', value: '3' },
            ],
          },
        },
        {
          title: 'Default option checked',
          inputs: {
            color: 'warn',
            selectedIndex: 1,
            radioButtons: [
              { name: 'Option 1', value: '1' },
              { name: 'Option 2', value: '2' },
              { name: 'Option 3', value: '3' },
            ],
          },
        },
        {
          title: 'Default option disabled',
          inputs: {
            color: 'warn',
            radioButtons: [
              { name: 'Option 1', value: '1' },
              { name: 'Option 2', value: '2', disabled: true },
              { name: 'Option 3', value: '3' },
            ],
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
          title: 'Default all disabled',
          inputs: {
            disabled: true,
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
            color: 'accent',
            radioButtons: [
              { name: '', value: '1' },
              { name: '', value: '2' },
              { name: '', value: '3' },
            ],
          },
        },
        {
          title: 'Default option checked',
          inputs: {
            color: 'accent',
            selectedIndex: 1,
            radioButtons: [
              { name: 'Option 1', value: '1' },
              { name: 'Option 2', value: '2' },
              { name: 'Option 3', value: '3' },
            ],
          },
        },
        {
          title: 'Default option disabled',
          inputs: {
            color: 'accent',
            radioButtons: [
              { name: 'Option 1', value: '1' },
              { name: 'Option 2', value: '2', disabled: true },
              { name: 'Option 3', value: '3' },
            ],
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
          title: 'Default all disabled',
          inputs: {
            disabled: true,
            color: 'accent',
          },
        },
      ],
    },
  ],
};
