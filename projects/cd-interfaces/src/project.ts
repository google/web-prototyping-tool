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
import { IDesignSystem } from './design';
import { IProjectAssets, IProjectAsset } from './assets';
import { IBaseDocument, IBaseDocumentMetadata } from './database';
import { IPublishable, PublishType, IPublishEntry } from './publish';
import { ElementPropertiesMap } from './property-models';
import { IZiplinePublishData } from './zipline';
import { ICodeComponentDocument } from './code-component';
import { ProjectDataset } from './dataset';

export const DefaultProjectType = 'Default';

export interface IProject extends IBaseDocument, IBaseDocumentMetadata, IPublishable {
  type: typeof DefaultProjectType | PublishType;
  ziplineData?: IZiplinePublishData;
  homeBoardId?: string;
  numComments: number;
  // For ordering
  boardIds: string[];
  assetIds: string[];
  symbolIds: string[];
}

export interface IProjectContentDocument extends IBaseDocument {
  id: string;
  projectId: string;
  type: EntityType;
}

export interface IProjectBindings {
  designSystem: IDesignSystem;
  assets: IProjectAssets;
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
