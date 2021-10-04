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

export const matChipsListConfig: IAuditView = {
  title: 'Material Chips List',
  elementType: cd.ElementEntitySubType.ChipList,
  variants: [
    {
      title: 'Primary',
      subVariants: [
        {
          title: 'Default',
          inputs: {},
        },
        {
          title: 'Default none selected',
          inputs: {
            chips: [{ name: 'Chip 1' }, { name: 'Chip 2' }, { name: 'Chip 3' }],
          },
        },
        {
          title: 'Default blank chip value',
          inputs: {
            chips: [{ name: 'Chip 1', selected: true }, { name: '' }, { name: 'Chip 3' }],
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
          title: 'Default none selected',
          inputs: {
            chips: [{ name: 'Chip 1' }, { name: 'Chip 2' }, { name: 'Chip 3' }],
            color: 'warn',
          },
        },
        {
          title: 'Default blank chip value',
          inputs: {
            color: 'warn',
            chips: [{ name: 'Chip 1', selected: true }, { name: '' }, { name: 'Chip 3' }],
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
          title: 'Default none selected',
          inputs: {
            chips: [{ name: 'Chip 1' }, { name: 'Chip 2' }, { name: 'Chip 3' }],
            color: 'accent',
          },
        },
        {
          title: 'Default blank chip value',
          inputs: {
            color: 'accent',
            chips: [{ name: 'Chip 1', selected: true }, { name: '' }, { name: 'Chip 3' }],
          },
        },
      ],
    },
  ],
};
