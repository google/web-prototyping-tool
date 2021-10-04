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
import { FirebaseCollection } from 'cd-common/consts';

export const remoteActionTag = '(from remote)';

export const typeForEntity = (entity: string, action: string, remote: boolean): string => {
  return remote ? `${entity} ${remoteActionTag} ${action}` : `${entity} ${action}`;
};

const documentRefForId = (document: string, id: string) => {
  return `${document}/${id}`;
};

export const projectContentsPathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.ProjectContents, id);
};

export const projectPathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.Projects, id);
};

export const commentPathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.Comments, id);
};

export const settingsPathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.UserSettings, id);
};

export const newsUpdatesPathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.NewsUpdates, id);
};

export const statusMessagePathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.StatusMessage, id);
};

export const publishEntryPathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.PublishEntries, id);
};

export const adminsPathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.Admins, id);
};

export const exceptionsPathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.Exceptions, id);
};

export const maintenanceModePathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.MaintenanceMode, id);
};

export const presencePathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.UserPresence, id);
};

export const pathForEntityType = (id: string, entityType: cd.EntityType): string => {
  const { Project, CommentThread, Comment } = cd.EntityType;
  if (entityType === Project) return projectPathForId(id);
  if (entityType === CommentThread || entityType === Comment) return commentPathForId(id);
  return projectContentsPathForId(id);
};

// Note: all id's written to screenshot collection must be prefixed with 'task-'
export const screenshotTaskPathForId = (id: string = ''): string => {
  return documentRefForId(FirebaseCollection.ScreenshotQueue, id);
};
