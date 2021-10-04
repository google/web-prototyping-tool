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

export const matTabsConfig: IAuditView = {
  title: 'Material Tabs',
  elementType: cd.ElementEntitySubType.Tabs,
  variants: [
    {
      title: 'Primary',
      subVariants: [
        {
          title: 'Default',
          inputs: {},
        },
        {
          title: 'Default with icon in tab',
          inputs: {
            childPortals: [{ name: 'Tab 1', icon: 'local_florist' }, { name: 'Tab 2' }],
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
          title: 'Default with icon in tab',
          inputs: {
            color: 'warn',
            childPortals: [{ name: 'Tab 1', icon: 'local_florist' }, { name: 'Tab 2' }],
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
          title: 'Default with icon in tab',
          inputs: {
            color: 'accent',
            childPortals: [{ name: 'Tab 1', icon: 'local_florist' }, { name: 'Tab 2' }],
          },
        },
      ],
    },
  ],
};
