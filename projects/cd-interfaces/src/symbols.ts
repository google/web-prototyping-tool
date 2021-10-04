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

import {
  IRichTextInput,
  IRootElementProperties,
  IRootInstanceProperties,
} from './component-instances';
import { ElementEntitySubType } from './entity-types';
import { IStringMap, RecursivePartial } from './index';
import { PropertyModel } from './property-models';
import { IPublishable } from './publish';
import { IElementChangePayload } from './project-changes';

// TODO: Move to models

export enum SymbolInputType {
  Property, // input that gets merged into base of property model
  Style, // input that gets merged into the style object of an element
}

export enum SymbolInputControl {
  Color = 'color',
  Background = 'background',
  Image = 'image',
  Icon = 'icon',
  RichText = 'richText',
  PortalReference = 'portalReference',
  Tabs = 'tabs',
  Steps = 'steps',
  Panels = 'panels',
  Text = 'text',
}

export enum SymbolStyleInputKey {
  Background = 'background',
  Color = 'color',
}

export enum SymbolPropertyInputKey {
  src = 'src',
  iconName = 'iconName',
  richText = 'richText',
  referenceId = 'referenceId',
  childPortals = 'childPortals',
  label = 'label',
}

export interface IRichTextStyles {
  textAlign?: any;
  overflow?: any;
  textOverflow?: any;
  whiteSpace?: any;
}

export interface IRichTextInputValue extends IRichTextInput {
  textStyles: IRichTextStyles;
}

interface ISymbolBaseInput {
  id: string;
  label: string;
  type: SymbolInputType;
  targetId: string;
  targetKey: SymbolStyleInputKey | SymbolPropertyInputKey;
  controlType: SymbolInputControl;
  defaultValue: any;
}

interface ISymbolPropertyInput extends ISymbolBaseInput {
  type: SymbolInputType.Property;
  targetKey: SymbolPropertyInputKey;
}

interface ISymbolStyleInput extends ISymbolBaseInput {
  type: SymbolInputType.Style;
  targetKey: SymbolStyleInputKey;
}

/** @deprecated This is here for legacy components */
export type SymbolInput = ISymbolPropertyInput | ISymbolStyleInput;

export interface ISymbolProperties extends IRootElementProperties, IPublishable {
  elementType: ElementEntitySubType.Symbol;
  /** @deprecated legacy symbolInputs are not used, use defaultInputs instead */
  symbolInputs: IStringMap<SymbolInput[]>;
  defaultInputs?: SymbolInstanceInputs;
  /** Map of components and if their properties are exposed */
  exposedInputs?: Record<string, boolean>;
}

export type SymbolInstanceInputs = IStringMap<RecursivePartial<PropertyModel>>;

export interface ISymbolInstanceProperties extends IRootInstanceProperties {
  elementType: ElementEntitySubType.SymbolInstance;
  instanceInputs: SymbolInstanceInputs;
  dirtyInputs: IStringMap<boolean | undefined | null>;
}

export type ISymbolMap = IStringMap<ISymbolProperties>;

export interface ICreateSymbolResult {
  symbol: ISymbolProperties;
  symbolInstance: ISymbolInstanceProperties;
  change: IElementChangePayload;
}

export interface IUnpackSymbolInstanceResult {
  change: IElementChangePayload;
  rootId: string;
}
