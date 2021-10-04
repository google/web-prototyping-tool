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

import { UnitTypes } from 'cd-metadata/units';
import { IStringMap, IDesignVariable, DesignVariableType } from 'cd-interfaces';

export const ThemeVariables = {
  Spacing1: 'spacing-1',
  Spacing2: 'spacing-2',
  Spacing3: 'spacing-3',
  Spacing4: 'spacing-4',
  ButtonPadding: 'button-padding',
} as const;

export const commonVariables: IStringMap<IDesignVariable> = {
  [ThemeVariables.Spacing1]: {
    name: 'Spacing 1',
    type: DesignVariableType.Layout,
    units: UnitTypes.Pixels,
    value: 8,
  },
  [ThemeVariables.Spacing2]: {
    name: 'Spacing 2',
    type: DesignVariableType.Layout,
    units: UnitTypes.Pixels,
    value: 16,
  },
  [ThemeVariables.Spacing3]: {
    name: 'Spacing 3',
    type: DesignVariableType.Size,
    units: UnitTypes.Pixels,
    value: 18,
  },
  [ThemeVariables.Spacing4]: {
    name: 'Spacing 4',
    type: DesignVariableType.Size,
    units: UnitTypes.Pixels,
    value: 24,
  },
  [ThemeVariables.ButtonPadding]: {
    name: 'Button Padding',
    type: DesignVariableType.Layout,
    units: UnitTypes.Pixels,
    value: 16,
  },
};
