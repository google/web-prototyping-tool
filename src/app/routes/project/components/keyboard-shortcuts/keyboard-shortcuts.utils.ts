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
import * as projectConfigs from '../../configs/project.config';
import { parseShortcut } from 'cd-utils/keycodes';

interface IShortcut extends cd.IConfig {
  parsedShortcut: string;
}

interface IShortcutConfig {
  header: string;
  config: projectConfigs.IConfigRecord | projectConfigs.IActivityRecord;
}

export interface IShortcutSection {
  header: string;
  shortcuts: IShortcut[];
}

const filteredShortcuts = (
  config: projectConfigs.IConfigRecord | projectConfigs.IActivityRecord
): IShortcut[] => {
  return Object.values(config)
    .filter((shortcut) => shortcut.shortcut)
    .map((shortcut) => ({
      ...shortcut,
      parsedShortcut: parseShortcut(shortcut.shortcut || ''),
    }));
};

export const convertConfigsToShortcutSections = (
  configs: IShortcutConfig[]
): IShortcutSection[] => {
  return configs.map(({ header, config }) => {
    return {
      header,
      shortcuts: filteredShortcuts(config),
    };
  });
};

export const shortcutConfig = [
  { header: 'Project', config: projectConfigs.ProjectConfig },
  { header: 'Panels', config: projectConfigs.PanelConfig },
  { header: 'Canvas', config: projectConfigs.CanvasConfig },
  { header: 'Zoom', config: projectConfigs.ZoomConfig },
  { header: 'Editing', config: projectConfigs.EditConfig },
  { header: 'Boards', config: projectConfigs.BoardConfig },
  { header: 'Components', config: projectConfigs.SymbolConfig },
];
