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

import { IConfig } from 'cd-interfaces';
import { IPanelHeaderAction } from './panel.interface';

export const PanelActivity = {
  Components: 'add-component',
  Assets: 'assets',
  About: 'about',
  Code: 'code-view',
  Data: 'data',
  Theme: 'theme',
  Layers: 'layers',
  Settings: 'settings',
  Feedback: 'feedback',
} as const;

type PanelActivityType = typeof PanelActivity[keyof typeof PanelActivity];

export interface IActivityConfig extends IConfig {
  readonly id: PanelActivityType;
  readonly headerAction?: IPanelHeaderAction;
}
