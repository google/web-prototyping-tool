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

import * as cd from 'cd-interfaces';
import firebase from 'firebase/app';
import { generateKeywordsForPublishEntry } from 'cd-common/utils';
import { deepCopy } from 'cd-utils/object';
import { createId } from 'cd-utils/guid';

export const createPublishEntry = (
  type: cd.PublishType,
  owner: cd.IUserIdentity,
  name: string,
  desc = '',
  tags: string[] = []
): cd.IPublishEntry => {
  const id = createId();
  const versions: cd.IPublishVersion[] = [];
  const timestamp = firebase.firestore.Timestamp.now();
  const publishEntry: cd.IPublishEntry = {
    id,
    type,
    versions,
    name,
    desc,
    tags,
    owner,
    creator: owner,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  // update keywords that will be searched over
  publishEntry.keywords = generateKeywordsForPublishEntry(publishEntry);
  return publishEntry;
};

export const updatePublishEntry = (
  publishEntry: cd.IPublishEntry,
  name: string,
  desc: string = '',
  tags: string[] = []
): cd.IPublishEntry => {
  const updatedEntry = deepCopy({ ...publishEntry, name, desc, tags });
  // update keywords that will be searched over
  updatedEntry.keywords = generateKeywordsForPublishEntry(updatedEntry);
  return updatedEntry;
};

export const createVersionMetadata = (
  projectId: string,
  name: string,
  symbolId?: string,
  codeComponentId?: string
): cd.IPublishVersion => {
  const id = createId();
  const createdAt = firebase.firestore.Timestamp.now();
  const version: cd.IPublishVersion = { id, name, projectId, createdAt };
  if (symbolId) version.symbolId = symbolId;
  if (codeComponentId) version.codeComponentId = codeComponentId;
  return version;
};
