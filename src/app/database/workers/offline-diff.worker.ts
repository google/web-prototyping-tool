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

/// <reference lib="webworker" />

import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { areObjectsEqual } from 'cd-utils/object';
import {
  IProject,
  IProjectContentDocument,
  EntityType,
  PublishType,
  IOfflineProjectState,
  PropertyModel,
  DefaultProjectType,
  IOfflineSyncOperation,
  IOfflineSyncOperationType,
  IOfflineDiffRequest,
  IOfflineDiffResponse,
} from 'cd-interfaces';

type ProjectDocument = IProject | IProjectContentDocument;

// The type property of a IProjectContentDocument is the EntityType
// The type property of a IProject is set to 'Default' | 'Template' | 'Symbol' | 'CodeComponent'
// Ideally, we would store EntityType on an IProject, but for now this function will compute if
// the document is a IProject based of the type property
const getEntityType = (doc: ProjectDocument): EntityType => {
  const { type } = doc;
  if (
    type === DefaultProjectType ||
    type === PublishType.Template ||
    type === PublishType.Symbol ||
    type === PublishType.CodeComponent
  ) {
    return EntityType.Project;
  }
  return type;
};

const convertDataToDocumentsMap = (data: IOfflineProjectState): Map<string, ProjectDocument> => {
  const { project, designSystem, elementProperties, assets } = data;
  const elementsList = Object.values(elementProperties) as PropertyModel[];
  const assetsList = Object.values(assets || {});

  const documentMap = new Map<string, ProjectDocument>();
  documentMap.set(project.id, project);
  documentMap.set(designSystem.id, designSystem);

  return [...elementsList, ...assetsList].reduce((acc, curr) => {
    acc.set(curr.id, curr);
    return acc;
  }, documentMap);
};

/**
 * Given localData and remoteData compute the set of operations needed to sync the localData to the remoteData
 * Local data is assumed to override any differences in the remoteData
 * @param localData
 * @param remoteData
 */
const calcSyncOperations = (
  localData: IOfflineProjectState,
  remoteData: IOfflineProjectState
): IOfflineSyncOperation[] => {
  const remoteDocuments = convertDataToDocumentsMap(remoteData);
  const remoteEntries = Array.from(remoteDocuments.entries());
  const localDocuments = convertDataToDocumentsMap(localData);
  const localEntries = Array.from(localDocuments.entries());
  const { Write, Delete } = IOfflineSyncOperationType;

  // For every document that exists in the remote but not in local, create a delete operation for it
  const deleteOperations = remoteEntries.reduce<IOfflineSyncOperation[]>((acc, curr) => {
    const [documentId, document] = curr;
    if (localDocuments.get(documentId)) return acc;
    const entityType = getEntityType(document);
    acc.push({ type: Delete, documentId, entityType });
    return acc;
  }, []);

  // For each local document, if the remote document is not equivalent, create a write operation for it
  return localEntries.reduce<IOfflineSyncOperation[]>((acc, curr) => {
    const [documentId, document] = curr;
    const remoteDoc = remoteDocuments.get(documentId);
    if (areObjectsEqual(document, remoteDoc)) return acc;

    const entityType = getEntityType(document);
    acc.push({ type: Write, entityType, documentId, document });
    return acc;
  }, deleteOperations);
};

fromEvent<MessageEvent>(globalThis, 'message')
  .pipe(
    map((item) => item?.data),
    map((data: IOfflineDiffRequest) => {
      const { localData, remoteData } = data;
      const syncOperations = calcSyncOperations(localData, remoteData);
      const { id: projectId } = data.localData.project;
      const response: IOfflineDiffResponse = { projectId, syncOperations };
      return response;
    })
  )
  .subscribe((response) => {
    self.postMessage(response);
  });
