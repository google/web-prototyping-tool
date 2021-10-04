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

import type { Action } from '@ngrx/store';
import type { ISelectItem } from './input';

// Makes every property even in sub-objects optional
export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export type ReadonlyRecord<K extends keyof any, T> = { readonly [P in K]: T };

// Stricter variation of Partial<> when you know exactly which keys to absolutely exclude
export type Except<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Units = '' | 'px' | '%' | 'fr' | 'auto' | 'ms';

export enum AssetSizes {
  Original = 'original',
  BigThumbnail = 'big-thumbnail',
  BigThumbnailXHDPI = 'big-thumbnail-xhdpi',
  SmallThumbnail = 'small-thumbnail',
  SmallThumbnailXHDPI = 'small-thumbnail-xhdpi',
}

export enum ScreenshotSizes {
  Original = 'original',
  BigThumbnail = 'big-thumbnail',
  BigThumbnailXHDPI = 'big-thumbnail-xhdpi',
}

export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Dimensions = Pick<IRect, 'width' | 'height'>;

export interface ILockingRect extends IRect {
  locked?: boolean;
}

export type IStringMap<T> = Record<string, T>;

export interface IKeyValue extends IValue {
  name: string;
  bindingName?: string;
  invalid?: boolean;
  disabled?: boolean;
}

export interface IValue {
  id?: string | null;
  index?: number;
  value?: number | string;
  units?: Units;
}

export interface IDataBoundValue {
  _$coDatasetId: string;
  lookupPath: string;
}

export type SelectItemOutput = string | number | ISelectItem;

export type InputValueType = string | number | null | ISelectItem | IValue | IDataBoundValue;

export type KeyValueTuple = [key: string, value: string];

export type ActionExtension<V extends Action = any> = V;

export interface IUserIdentity {
  readonly id: string;
  readonly email: string | null;
}

export interface IUser extends IUserIdentity {
  name?: string | null;
  photoUrl?: string | null;
  profileUrl?: string | null;
}

export type PartialUser = Partial<IUser>;

export interface IToggleButton {
  classAttr?: string;
  iconName?: string | undefined;
  id?: string;
  text?: string | undefined;
}

export interface IToast {
  id: string;
  message: string;
  duration?: number; // Set to -1 for untimed toast
  iconName?: string;
  showLoader?: boolean;
  confirmLabel?: string;
  dismissLabel?: string;
  hideDismiss?: boolean;
  confirmIconName?: string;
  dismissIconName?: string;
  callback?: () => void;
}

export interface IProjectTilePreview {
  label: string;
  imgSrc: string;
  routerLink: string;
}

export interface IMenuListItem {
  count?: number;
  id: string;
  name: string;
}

export enum ComponentSize {
  Auto = 'auto',
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export type ReducerFunction = (state: any, action: Action | any) => any;

export interface IReducerFunctionLookup {
  readonly [key: string]: ReducerFunction;
}

export enum Position {
  Top = 'top',
  Bottom = 'bottom',
  Left = 'left',
  Right = 'right',
}

export interface IConfig {
  /** Redux Action */
  readonly action?: string;
  readonly additionalParams?: any;
  readonly id?: string | number;
  /** Keyboard Shortcut */
  readonly shortcut?: string[] | string;
  readonly undoable?: boolean;
  readonly e2eLabel?: string;
  /** Don't preventDefault on keyboard shortcut */
  passive?: boolean;
  /** Color Swatch for menu*/
  color?: string;
  /** Material icon for menu*/
  icon?: string;
  title: string;
  checked?: boolean;
  /** Nested menu items */
  children?: IConfig[];
  disabled?: boolean;
}

export enum ConfigTargetType {
  Canvas,
  CanvasSymbolMode,
  Board,
  Element,
  ElementSymbolMode,
  Symbol,
  SymbolInstance,
  CodeComponent,
  CodeComponentInstance,
}

export enum InsertRelation {
  Before = 'before',
  After = 'after',
  AfterGroup = 'afterGroup',
  Append = 'append',
  Prepend = 'prepend',
}

export interface IInsertLocation {
  elementId: string;
  relation: InsertRelation;
}

export interface IPattern {
  name: string;
  iconPath: string;
  description?: string;
  ngTemplate: string;
}

export interface IMenuConfig extends IConfig {
  divider?: boolean;
  value?: string | number;
}

export type MenuConfigList = Array<IMenuConfig | IMenuConfig[]>;

export interface IPanel {
  visible?: boolean;
  size: number;
}

export interface IRichTooltip {
  text: string;
  link?: string;
  linkText?: string;
}
