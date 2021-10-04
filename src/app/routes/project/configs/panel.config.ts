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

import { IPanelsState } from '../interfaces/panel.interface';
import { PropertyPanelState } from 'cd-interfaces';
import { ActivityTopConfig, PropertyModesConfig } from './context.menu.config';

export const PanelSizeConfig = {
  Left: 256,
  MinLeft: 256,
  MaxLeft: 500,
  Right: 250,
  MinRight: 227,
  MaxRight: 350,
  Bottom: 320,
  MinBottom: 120,
  MaxBottom: 800,
} as const;

export const initialPanel: IPanelsState = {
  currentActivity: ActivityTopConfig[0], // Components Panel
  propertyMode: PropertyModesConfig[0],
  leftPanel: {
    visible: true,
    size: PanelSizeConfig.Left,
  },
  rightPanel: {
    visible: true,
    size: PanelSizeConfig.Right,
  },
  bottomPanel: {
    visible: false,
    size: PanelSizeConfig.Bottom,
  },
  symbolMode: false,
  keyboardShortcutsModalOpen: false,
  recordStateChanges: false,
  propertiesPanelState: PropertyPanelState.Default,
};
