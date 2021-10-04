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

export enum AutoNavLinkType {
  Board = 'board',
  Url = 'url',
}

export enum AutoNavItemType {
  Navigation = 'nav',
  Header = 'head',
  Divider = 'divider',
}

export interface IAutoNavItemBase {
  type: AutoNavItemType;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface IAutoNavItemNavigation extends IAutoNavItemBase {
  type: AutoNavItemType.Navigation;
}

export interface IAutoNavItemUrl extends IAutoNavItemNavigation {
  linkType: AutoNavLinkType.Url;
  site?: string;
  newTab?: boolean;
}

export interface IAutoNavItemBoard extends IAutoNavItemNavigation {
  linkType: AutoNavLinkType.Board;
  referenceId?: string;
  top?: boolean;
}

export interface IAutoNavItemDivider extends IAutoNavItemBase {
  type: AutoNavItemType.Divider;
}

export interface IAutoNavItemHeader extends IAutoNavItemBase {
  type: AutoNavItemType.Header;
}

export type IAutoNavItem =
  | IAutoNavItemUrl
  | IAutoNavItemBoard
  | IAutoNavItemDivider
  | IAutoNavItemHeader;
