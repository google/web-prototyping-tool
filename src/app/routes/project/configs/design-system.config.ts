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

import { LayerIcons } from 'cd-common/consts';
import { IMenuConfig } from 'cd-interfaces';
import { environment } from 'src/environments/environment';

export enum DesignSystemMenu {
  Export,
  ExportVars,
  Import,
  GenerateStyle,
  GenerateIconBoard,
}

const styleGuideMenu = {
  id: DesignSystemMenu.GenerateStyle,
  title: 'Generate style guide',
  icon: 'palette',
};

const iconMenuItem = {
  id: DesignSystemMenu.GenerateIconBoard,
  title: 'Generate icon board',
  icon: LayerIcons.Icon,
};

export const DESIGN_SYSTEM_MENU: IMenuConfig[][] = [
  [
    {
      id: DesignSystemMenu.ExportVars,
      title: 'Export CSS vars',
      icon: 'color_lens',
    },
    {
      id: DesignSystemMenu.Export,
      title: 'Export design system',
      icon: 'get_app',
    },
    {
      id: DesignSystemMenu.Import,
      title: 'Import design system',
      icon: 'file_upload',
    },
  ],
  !environment.production ? [styleGuideMenu, iconMenuItem] : [styleGuideMenu],
];
