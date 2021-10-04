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

import { buildAngularMaterial } from './themes/angular-material';
import { buildAngularMaterialDark } from './themes/angular-material-dark';
import { buildBaseline } from './themes/baseline';
import { buildBaselineDark } from './themes/baseline-dark';
import { buildCrane } from './themes/crane';
import { buildFortnightly } from './themes/fortnightly';
import { Theme } from './themes/consts';
import type { ITheme, ReadonlyRecord } from 'cd-interfaces';

export * from './lib/consts';
export * from './lib/icons';
export * from './lib/fonts';
export * from './tools/tonal-palette';
export * from './tools/utils';
export * from './themes/consts';

export const themeFromId: ReadonlyRecord<Theme, () => ITheme> = {
  [Theme.AngularMaterial]: buildAngularMaterial,
  [Theme.AngularMaterialDark]: buildAngularMaterialDark,
  [Theme.Baseline]: buildBaseline,
  [Theme.BaselineDark]: buildBaselineDark,
  [Theme.Crane]: buildCrane,
  [Theme.Fortnightly]: buildFortnightly,
};
