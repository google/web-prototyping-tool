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

export const matProgressBarConfig: IAuditView = {
  title: 'Material Progress Bar',
  elementType: cd.ElementEntitySubType.ProgressBar,
  columnWidth: '100%',
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
          title: 'Indeterminate',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
          },
          hidden: environment.e2e,
        },
        {
          title: 'Query',
          inputs: {
            mode: cd.ProgressBarMode.Query,
          },
          hidden: environment.e2e,
        },
        {
          title: 'Buffer',
          inputs: {
            mode: cd.ProgressBarMode.Buffer,
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
          title: 'Indeterminate',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            color: 'warn',
          },
          hidden: environment.e2e,
        },
        {
          title: 'Query',
          inputs: {
            mode: cd.ProgressBarMode.Query,
            color: 'warn',
          },
          hidden: environment.e2e,
        },
        {
          title: 'Buffer',
          inputs: {
            mode: cd.ProgressBarMode.Buffer,
            color: 'warn',
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
          title: 'Indeterminate',
          inputs: {
            mode: cd.ProgressBarMode.Indeterminate,
            color: 'accent',
          },
          hidden: environment.e2e,
        },
        {
          title: 'Query',
          inputs: {
            mode: cd.ProgressBarMode.Query,
            color: 'accent',
          },
          hidden: environment.e2e,
        },
        {
          title: 'Buffer',
          inputs: {
            mode: cd.ProgressBarMode.Buffer,
            color: 'accent',
          },
          hidden: environment.e2e,
        },
      ],
    },
  ],
};
