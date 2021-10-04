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

import { EntityType } from './entity-types';
import { IDesignSystem, IDesignSystemDocument } from './design';
import { AssetMap, IProjectAsset } from './assets';
import { IBaseDocument, IBaseDocumentMetadata } from './database';
import { IPublishable, PublishType, IPublishEntry } from './publish';
import { ElementPropertiesMap, PropertyModel } from './property-models';
import { ICodeComponentDocument } from './code-component';
import { ProjectDataset } from './dataset';
import { IBoardProperties } from './component-instances';
import { ISymbolProperties } from './symbols';
import type firebase from 'firebase/app';
import { ChangePayload } from './project-changes';

export interface IChangeMarker {
  id: string;
  timestamp: firebase.firestore.Timestamp;
}

export interface IBaseProjectDocument extends IBaseDocument {
  type: string;
  changeMarker?: IChangeMarker;
}

export const DefaultProjectType = 'Default';

export interface IProject extends IBaseProjectDocument, IBaseDocumentMetadata, IPublishable {
  type: typeof DefaultProjectType | PublishType;
  homeBoardId?: string;
  numComments: number;
}

export interface IProjectContentDocument extends IBaseProjectDocument {
  projectId: string;
  type: EntityType;
}

export type ProjectContentMap = Record<string, IProjectContentDocument>;

export interface IProjectBindings {
  designSystem: IDesignSystem;
  assets: AssetMap;
}

export interface IBuiltInTemplate {
  id: string;
  name: string;
  builtInTemplate: true;
  themeId: string;
  imageUrl: string;
  imagePosition?: string;
}

export interface ILoadedTemplate {
  id: string;
  name: string;
  publishEntry: IPublishEntry;
  project: IProject;
  homeBoardImageUrl?: string;
  allBoardImageUrls: string[];
}

export type ProjectTemplate = IBuiltInTemplate | ILoadedTemplate;

export interface IExportedProject {
  project: IProject;
  elementProperties: ElementPropertiesMap;
  designSystem: IDesignSystem;
  assets: IProjectAsset[];
  codeComponents: ICodeComponentDocument[];
  datasets: ProjectDataset[];
}

export interface IOutletFrameSubscription {
  boards: IBoardProperties[];
  symbols: ISymbolProperties[];
}

export interface IContentSection<T> {
  idsCreatedInLastChange: Set<string>;
  idsUpdatedInLastChange: Set<string>;
  idsDeletedInLastChange: Set<string>;
  records: Record<string, T>;
  loaded: boolean;
}

export type ElementContent = IContentSection<PropertyModel>;
export type DesignSystemContent = IContentSection<IDesignSystemDocument>;
export type AssetContent = IContentSection<IProjectAsset>;
export type CodeCmpContent = IContentSection<ICodeComponentDocument>;
export type DatasetContent = IContentSection<ProjectDataset>;

export interface IProjectContent {
  project: IProject;
  elementContent: ElementContent;
  designSystemContent: DesignSystemContent;
  assetContent: AssetContent;
  codeCmpContent: CodeCmpContent;
  datasetContent: DatasetContent;
}

export interface IBlankProjectCreate {
  project: IProject;
  changes: ChangePayload[];
}
