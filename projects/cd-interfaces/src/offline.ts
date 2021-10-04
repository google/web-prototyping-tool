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

import { IProject, IProjectContentDocument } from './project';
import { IDesignSystemDocument } from './design';
import { ElementPropertiesMap } from './property-models';
import { AssetMap } from './assets';
import { EntityType } from './entity-types';
import { ICodeComponentDocument } from './code-component';
import { ProjectDataset } from './dataset';

export interface IOfflineProjectState {
  project: IProject;
  elementProperties: ElementPropertiesMap;
  designSystem: IDesignSystemDocument;
  codeComponents?: ICodeComponentDocument[];
  assets?: AssetMap;
  datasets?: ProjectDataset[];
}

export interface IOfflineProjectStateMessage {
  projectId: string;
  offlineState: IOfflineProjectState;
}

export interface IOfflineDiffRequest {
  remoteData: IOfflineProjectState;
  localData: IOfflineProjectState;
}

export enum IOfflineSyncOperationType {
  Write = 'Write',
  Delete = 'Delete',
}

export interface IOfflineSyncOperation {
  type: IOfflineSyncOperationType;
  entityType: EntityType;
  documentId: string;
  document?: IProject | IProjectContentDocument;
}

export interface IOfflineDiffResponse {
  projectId: string;
  syncOperations: IOfflineSyncOperation[];
}
