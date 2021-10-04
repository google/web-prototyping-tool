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

export const matExpansionPanelConfig: IAuditView = {
  title: 'Material Expansion Panel',
  elementType: cd.ElementEntitySubType.ExpansionPanel,
  variants: [
    {
      title: 'Default',
      subVariants: [
        {
          title: 'Default',
          inputs: {},
        },
        {
          title: 'Default flat gutters',
          inputs: {
            displayMode: 'flat',
          },
        },
        {
          title: 'Default hide toggle',
          inputs: {
            hideToggle: true,
          },
        },
        {
          title: 'Default toggle before',
          inputs: {
            togglePosition: 'before',
          },
        },
        {
          title: 'Default panel expanded',
          inputs: {
            childPortals: [{ name: 'Panel 1', selected: true }, { name: 'Panel 2' }],
          },
        },
      ],
    },
  ],
};
