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

import { IBoardProperties, IComponentInstance } from './component-instances';
import { IStringMap, ReadonlyRecord, RecursivePartial } from './index';
import { ISymbolInstanceProperties, ISymbolProperties } from './symbols';
import { ICodeComponentDocument } from './code-component';
import { IElementChangePayload } from './project-changes';
// TODO: Rename to reflect component naming
// TODO: Replace with IComponentInstance<T as IBaseElementInputs>

export type PropertyModel = IComponentInstance | ISymbolInstanceProperties | ISymbolProperties;

export type PropertyModelInputs = PropertyModel['inputs'];

export type ReadOnlyPropertyModelList = ReadonlyArray<PropertyModel>;

export type RootElement = IBoardProperties | ISymbolProperties;

export type CustomComponent = ISymbolProperties | ICodeComponentDocument;

export type ElementPropertiesMap = IStringMap<PropertyModel | undefined>;
export type ReadonlyElementPropertiesMap = ReadonlyRecord<string, PropertyModel | undefined>;

export interface IPropertiesUpdatePayload {
  elementId: string;
  properties: RecursivePartial<PropertyModel>;
}

export type UpdatePayloadProperties = IPropertiesUpdatePayload['properties'];

export interface IMergeUpdatesResult {
  elementProperties: ElementPropertiesMap;
  updatedIds: Set<string>;
}

export interface IComponentInstanceGroup {
  rootIds: string[];
  models: PropertyModel[];
}

export type IDReplacementMap = Map<string, string>;

export interface ICopiedComponentInstanceGroup extends IComponentInstanceGroup {
  idMap: IDReplacementMap;
}

export interface ICreateBoardPayload {
  boards: IBoardProperties[];
  boardContents: IComponentInstanceGroup[];
}

export interface IGroupElementsPayload {
  groupElementId: string;
  changes: IElementChangePayload[];
}

export interface IUngroupElementsPayload {
  unGroupedIds: string[];
  changes: IElementChangePayload[];
}

export interface IGridLayoutPayload {
  gridTemplateColumns: any[];
  gridTemplateRows: any[];
}
