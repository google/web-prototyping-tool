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

import type { IValue } from './index';

export interface IIcon {
  id: string;
}

export interface ICategory {
  name: string;
  icons: Array<IIcon>;
}

export interface IIconLibrary {
  font: string;
  categories: Array<ICategory>;
}

export interface IIconConfig {
  iconName: string;
  fontFamily: IValue;
  size: IValue;
  color: IValue;
}

export enum IconSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}
export interface IIconset {
  label: string;
  name: string;
  size: IconSize;
  icons: string[];
  svgPath: string;
}
export interface IIconsetLibrary {
  iconsets: IIconset[];
}

export interface IIconsetIconConfig {
  name: string;
  iconset: string;
  size: IconSize;
}

export type SelectedIcon = string | IIconsetIconConfig;

export enum IconPickerMode {
  AllIcons,
  MaterialOnly,
  Only,
}

export interface IIconOptionsConfig {
  /** Set whether using Material Icons, Cloud Icons or both (default is both) */
  iconPickerMode?: IconPickerMode;

  /** Sizes allowed for cloud platform icons */
  iconSizesAllowed?: IconSize[];

  /** Iconsets allowed for cloud platform icons */
  allowedIconSets?: string[];
}

export interface IProcessedIcon {
  svgLookup: string;
  config: IIconsetIconConfig;
}

export interface IProcessedIconset extends IIconset {
  processedIcons: IProcessedIcon[];
}
