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

export enum SelectItemType {
  Default = '',
  Empty = 'empty',
  Icon = 'icon',
  Image = 'image',
  Color = 'color',
  Check = 'check',
  Header = 'header',
  FontWeight = 'font-weight',
  FontFamily = 'font-family',
}

export interface ISelectItem {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  type?: SelectItemType;
  value: string;
  disabled?: boolean;
  divider?: boolean;
  preview?: string;
  selected?: boolean;
  action?: boolean;
  index?: number;
}

export enum InputType {
  Percent = 'percent',
  Number = 'number',
  Text = 'text',
  Select = 'select',
  Units = 'units',
}

export enum TextAlign {
  Left = 'left',
  Right = 'right',
  Center = 'center',
}

export type IRadioData = Pick<ISelectItem, 'value' | 'title' | 'selected' | 'disabled'>;
