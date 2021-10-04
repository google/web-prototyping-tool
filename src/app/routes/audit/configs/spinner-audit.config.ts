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
import { environment } from 'src/environments/environment';

export const matSpinnerConfig: IAuditView = {
  title: 'Material Spinner',
  elementType: cd.ElementEntitySubType.Spinner,
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
          title: 'Default thicker stroke',
          inputs: {
            strokeWidth: 6,
          },
        },
        {
          title: 'Default larger size',
          inputs: {
            diameter: 100,
          },
        },
        {
          title: 'Indeterminate',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
          },
          hidden: environment.e2e,
        },
        {
          title: 'Indeterminate thicker stroke',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            strokeWidth: 6,
          },
          hidden: environment.e2e,
        },
        {
          title: 'Indeterminate larger size',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            diameter: 100,
          },
          hidden: environment.e2e,
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
          title: 'Default thicker stroke',
          inputs: {
            strokeWidth: 6,
            color: 'warn',
          },
        },
        {
          title: 'Default larger size',
          inputs: {
            diameter: 100,
            color: 'warn',
          },
        },
        {
          title: 'Indeterminate',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            color: 'warn',
          },
          hidden: environment.e2e,
        },
        {
          title: 'Indeterminate thicker stroke',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            color: 'warn',
            strokeWidth: 6,
          },
          hidden: environment.e2e,
        },
        {
          title: 'Indeterminate larger size',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            color: 'warn',
            diameter: 100,
          },
          hidden: environment.e2e,
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
          title: 'Default thicker stroke',
          inputs: {
            strokeWidth: 6,
            color: 'accent',
          },
        },
        {
          title: 'Default larger size',
          inputs: {
            diameter: 100,
            color: 'accent',
          },
        },
        {
          title: 'Indeterminate',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            color: 'accent',
          },
          hidden: environment.e2e,
        },
        {
          title: 'Indeterminate thicker stroke',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            color: 'accent',
            strokeWidth: 6,
          },
          hidden: environment.e2e,
        },
        {
          title: 'Indeterminate larger size',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            color: 'accent',
            diameter: 100,
          },
          hidden: environment.e2e,
        },
      ],
    },
  ],
};
