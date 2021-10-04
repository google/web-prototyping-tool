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

import { IFontFamily, ITypographyStyle } from './font';
import { IStringMap, Units } from './index';
import { IProjectContentDocument } from './project';
import { EntityType } from './entity-types';

interface IDesignAttribute {
  id?: string;
  name: string;
  index?: number;
  value: string | number;
}
export interface IDesignColor {
  variants?: string[];
  index?: number;
  name: string;
  value: string;
  hidden?: boolean;
}

export interface IDesignIcon {
  fontId: string;
  name: string;
  source: string;
}

export enum DesignVariableType {
  Layout = 'layout',
  Size = 'size',
  Opacity = 'opacity',
  Custom = 'custom',
  Shadow = 'shadow',
}
export interface IDesignVariable extends IDesignAttribute {
  units?: Units;
  type: DesignVariableType;
}

export interface IDesignSystem {
  themeId?: string; // optionally bound to canonical theme
  colors: IStringMap<IDesignColor>;
  icons: IFontFamily;
  fonts: IStringMap<IFontFamily>;
  typography: IStringMap<ITypographyStyle>;
  variables?: IStringMap<IDesignVariable>;
  globalCssClass?: string | null;
  isDarkTheme?: boolean;
}

export interface IDesignSystemDocument extends IDesignSystem, IProjectContentDocument {
  type: EntityType.DesignSystem;
}

export type DesignSystemMap = Record<string, IDesignSystemDocument>;
