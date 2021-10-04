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

import { Observable, fromEvent } from 'rxjs';
import { offlineDiffWorker } from './index';
import { map, filter, first } from 'rxjs/operators';
import * as utils from '../../routes/project/utils/project.utils';
import * as cd from 'cd-interfaces';
import { deleteIdbData, getIdbData } from './indexed-db.utils';
import firebase from 'firebase/app';
import { createContentSection } from 'cd-common/utils';

const convertFirebaseTimestamp = (ts: firebase.firestore.Timestamp) => {
  return new firebase.firestore.Timestamp(ts.seconds, ts.nanoseconds);
};

export const deleteLocalDataForProject = async (projectId: string) => {
  await deleteIdbData(projectId);
};

export const getLocalDataForProject = async (
  projectId: string,
  localDatabaseDisabled = false
): Promise<cd.IProjectContent | undefined> => {
  if (localDatabaseDisabled) return undefined;
  const localDataString: string | undefined = await getIdbData(projectId);
  if (!localDataString) return undefined;
  const content = JSON.parse(localDataString) as cd.IProjectContent;

  // Recreate the Sets in each content section since they won't get recreated with JSON.parse
  const { project } = content;
  const elementContent = createContentSection(content.elementContent.records, true, true);
  const designSystemContent = createContentSection(content.designSystemContent.records, true, true);
  const assetContent = createContentSection(content.assetContent.records, true, true);
  const codeCmpContent = createContentSection(content.codeCmpContent.records, true, true);
  const datasetContent = createContentSection(content.datasetContent.records, true, true);

  // Restore timestamps on project document
  const { changeMarker } = project;
  project.changeMarker = changeMarker
    ? { ...changeMarker, timestamp: convertFirebaseTimestamp(changeMarker.timestamp) }
    : undefined;
  project.createdAt = convertFirebaseTimestamp(project.createdAt);
  project.updatedAt = convertFirebaseTimestamp(project.updatedAt);
  // TODO: convert timestamps on all changeMarkers?

  return {
    project,
    elementContent,
    designSystemContent,
    assetContent,
    codeCmpContent,
    datasetContent,
  };
};

export const isRemoteDataNewerThanLocalData = (
  remote: firebase.firestore.Timestamp,
  local?: firebase.firestore.Timestamp
): boolean => {
  return local ? remote.seconds > local.seconds : false;
};

export const requestDataDiff = (
  localData: cd.IOfflineProjectState,
  remoteData: cd.IOfflineProjectState
): Observable<cd.IOfflineDiffResponse> => {
  const message: cd.IOfflineDiffRequest = { localData, remoteData };
  const { id } = localData.project;

  // subscribe to first message back with this projectId, then post request
  const diffResponse = fromEvent<MessageEvent>(offlineDiffWorker, 'message').pipe(
    map((event) => event.data as cd.IOfflineDiffResponse),
    filter((data) => data.projectId === id),
    first()
  );

  offlineDiffWorker.postMessage(message);
  return diffResponse;
};

export const convertProjectToOfflineState = (
  project: cd.IProject,
  contents: cd.IProjectContentDocument[]
): cd.IOfflineProjectState => {
  const { Element, Asset, CodeComponent } = cd.EntityType;
  const { findDesignSystemInProjectContents, filterProjectContents } = utils;
  const designSystem = findDesignSystemInProjectContents(contents);
  const elementsList = filterProjectContents<cd.PropertyModel>(contents, Element);
  const assetsList = filterProjectContents<cd.IProjectAsset>(contents, Asset);
  const codeComponents = filterProjectContents<cd.ICodeComponentDocument>(contents, CodeComponent);
  const elementProperties = elementsList.reduce<cd.ElementPropertiesMap>((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});

  const assets = assetsList.reduce<cd.AssetMap>((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});

  return { project, designSystem, elementProperties, assets, codeComponents };
};
