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

import { IProject } from './project';
import { PropertyModel } from './property-models';
import { IProjectAsset } from './assets';
import { IDesignSystemDocument } from './design';
import { ICommentThreadDocument, ICommentDocument } from './comment';
import { IUserSettings } from './user';
import { IPublishEntry } from './publish';
import type firebase from 'firebase/app';
import { IUserIdentity } from './index';
import { IExceptionEvent } from './exception';
import { IScreenshotTask } from './screenshots';
import { ICodeComponentDocument } from './code-component';
import { ProjectDataset } from './dataset';

export interface IBaseDocument {
  id: string;
  keywords?: string[];
}

export interface IBaseDocumentMetadata {
  name: string;
  desc?: string;
  tags?: string[];
  owner: IUserIdentity;
  creator: IUserIdentity;
  /** A list of email addresses */
  editors?: string[];
  createdAt: firebase.firestore.Timestamp;
  updatedAt: firebase.firestore.Timestamp;
}

export interface IScreenshotable {
  lastScreenshotTime?: firebase.firestore.Timestamp;
}

export type CdDatabaseDocument =
  | IProject
  | PropertyModel
  | IProjectAsset
  | IDesignSystemDocument
  | ICommentThreadDocument
  | ICommentDocument
  | IUserSettings
  | IPublishEntry
  | IExceptionEvent
  | IScreenshotTask
  | ICodeComponentDocument
  | ProjectDataset;

export type WriteBatchPayload = Map<string, CdDatabaseDocument>;
