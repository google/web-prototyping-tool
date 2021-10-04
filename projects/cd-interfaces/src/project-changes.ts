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

import { IProjectAsset } from './assets';
import { ICodeComponentDocument } from './code-component';
import { ProjectDataset } from './dataset';
import { IDesignSystemDocument } from './design';
import { EntityType } from './entity-types';
import { IUserIdentity, RecursivePartial } from './index';
import { IProject, IChangeMarker } from './project';
import { PropertyModel } from './property-models';

export type ChangeableDocument =
  | IProject
  | PropertyModel
  | IDesignSystemDocument
  | IProjectAsset
  | ICodeComponentDocument
  | ProjectDataset;

export interface IUpdateChange<T extends ChangeableDocument> {
  id: string;
  update: RecursivePartial<T>;
}

export interface IChangePayload<T extends ChangeableDocument> {
  type: EntityType;
  sets?: T[];
  updates?: IUpdateChange<T>[];
  deletes?: string[]; // array of ids
}

export interface IProjectChangePayload extends IChangePayload<IProject> {
  type: EntityType.Project;
}

export interface IElementChangePayload extends IChangePayload<PropertyModel> {
  type: EntityType.Element;
}

export interface IDesignSystemChangePayload extends IChangePayload<IDesignSystemDocument> {
  type: EntityType.DesignSystem;
}

export interface IAssetChangePayload extends IChangePayload<IProjectAsset> {
  type: EntityType.Asset;
}

export interface ICodeCmpChangePayload extends IChangePayload<ICodeComponentDocument> {
  type: EntityType.CodeComponent;
}

export interface IDatasetChangePayload extends IChangePayload<ProjectDataset> {
  type: EntityType.Dataset;
}

export type ChangePayload =
  | IProjectChangePayload
  | IElementChangePayload
  | IDesignSystemChangePayload
  | IAssetChangePayload
  | ICodeCmpChangePayload
  | IDatasetChangePayload;

export interface IChangeRequest {
  user: IUserIdentity;
  projectId: string;
  changeMarker: IChangeMarker;
  payload: ChangePayload[];
}

export enum FirestoreChangeType {
  Added = 'added',
  Modified = 'modified',
  Removed = 'removed',
}

export type DatabaseChangeTuple = [FirestoreChangeType, ChangeableDocument];
