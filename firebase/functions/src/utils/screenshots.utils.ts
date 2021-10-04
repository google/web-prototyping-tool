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

import { ObjectMetadata } from 'firebase-functions/lib/providers/storage';
import { screenshotsConversionArgsConfig } from '../configs/screenshots.config';
import { firebaseApp } from './firebase.utils';
import { generateDestPaths } from './image.utils';
import { DEFAULT_BOARD_STYLES } from 'cd-common/models';
import { areObjectsEqual } from 'cd-utils/object';
import { createScreenshotTaskDocumentId, createScreenshotTask } from 'cd-common/utils';
import {
  FirebaseCollection,
  FirebaseField,
  FirebaseQueryOperation,
  ORIGINAL_SCREENSHOT_FILENAME,
  SCREENSHOTS_PATH_PREFIX,
  SCREENSHOT_TASK_ID_PREFIX,
} from 'cd-common/consts';
import * as firebaseAdmin from 'firebase-admin';
import * as cd from 'cd-interfaces';
import * as path from 'path';

export const isTypeElement = (obj: cd.IProjectContentDocument) =>
  obj.type === cd.EntityType.Element;

export const isTypeCodeComponent = (obj: cd.IProjectContentDocument) =>
  obj.type === cd.EntityType.CodeComponent;

export const screenshotQueueCollection = firebaseApp
  .firestore()
  .collection(FirebaseCollection.ScreenshotQueue);

export const projectContentsCollection = firebaseApp
  .firestore()
  .collection(FirebaseCollection.ProjectContents);

export const projectsCollection = firebaseApp.firestore().collection(FirebaseCollection.Projects);

export const removePayload = async (rootId: string) => {
  console.log(`Removing screenshot task for target: ${rootId}`);
  await screenshotQueueCollection.doc(`${SCREENSHOT_TASK_ID_PREFIX}${rootId}`).delete();
};

export const addPayloadToQueue = (
  projectId?: string,
  rootId?: string,
  creationTs?: number
): Promise<boolean> => {
  if (!projectId || !rootId) return Promise.resolve(false);

  return firebaseApp.firestore().runTransaction(async (transaction) => {
    const newTaskDocumentRef = firebaseApp
      .firestore()
      .collection(FirebaseCollection.ScreenshotQueue)
      .doc(createScreenshotTaskDocumentId(rootId));

    return transaction.get(newTaskDocumentRef).then((doc) => {
      if (!doc.exists) {
        const screenshotPayload = createScreenshotTask(projectId, rootId, creationTs);
        transaction.create(newTaskDocumentRef, screenshotPayload);
      }
      return true;
    });
  });
};

export const getRootIdsForProject = async (projectId: string): Promise<string[]> => {
  const rootDocsQuery = await projectContentsCollection
    .where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, projectId)
    .where(FirebaseField.DocumentType, FirebaseQueryOperation.Equals, cd.EntityType.Element)
    .where(FirebaseField.ElementType, FirebaseQueryOperation.In, [
      cd.ElementEntitySubType.Board,
      cd.ElementEntitySubType.Symbol,
    ])
    .get();

  return rootDocsQuery.docs.map((d) => d.data().id);
};

export const addPayloadsForProject = async (projectId: string, timestamp?: number) => {
  try {
    const projectDocumentQueryResult = await projectsCollection
      .where(FirebaseField.DocumentId, FirebaseQueryOperation.Equals, projectId)
      .limit(1)
      .get();

    if (projectDocumentQueryResult.size === 1) {
      const allRootIds = await getRootIdsForProject(projectId);
      for (const id of allRootIds) {
        await addPayloadToQueue(projectId, id, timestamp);
      }
    } else {
      throw new Error(`Project ${projectId} not found`);
    }
  } catch (err) {
    console.log('Error', err);
  }
};

export const isProcessable = (object: ObjectMetadata): boolean => {
  const { name } = object;

  if (!name) return false;
  if (!name.startsWith(SCREENSHOTS_PATH_PREFIX)) return false;

  const basename = path.basename(name);
  if (!basename.startsWith(ORIGINAL_SCREENSHOT_FILENAME)) return false;

  return true;
};

export const shouldSkipScreenshot = (element: cd.PropertyModel) => {
  if (element.childIds.length !== 0) return false;
  return areObjectsEqual(element.styles, DEFAULT_BOARD_STYLES);
};

export const generateConversionTargets = (
  srcRemotePath: string,
  originalDimension: cd.IImageDimension
): cd.IImageConversionTarget[] =>
  Object.entries(screenshotsConversionArgsConfig).map(([name, argGetter]) => {
    const destPaths = generateDestPaths(srcRemotePath, name);
    const convertArgs = argGetter(originalDimension);
    const target: cd.IImageConversionTarget = { name, destPaths, convertArgs };
    return target;
  });

export const getScreenshotDimension = async (
  elementId: string
): Promise<cd.IImageDimension | undefined> => {
  const docRef = projectContentsCollection.doc(elementId);
  const doc = await docRef.get();
  const data = doc.data();
  const frame = data?.frame;
  if (!frame || !frame.width || !frame.height) return;
  const { width, height } = frame;
  return { width, height };
};

export const getProjectContentDocById = (docId: string) =>
  projectContentsCollection.doc(docId).get();

export const deleteScreenshotsForId = (documentId: string) => {
  const bucketFilePath = `${SCREENSHOTS_PATH_PREFIX}/${documentId}`;
  const bucket = firebaseApp.storage().bucket();
  return bucket.deleteFiles({ prefix: bucketFilePath });
};

export const updateScreenshotTimestamp = (id: string): Promise<FirebaseFirestore.WriteResult> => {
  return firebaseApp
    .firestore()
    .doc(`${FirebaseCollection.ProjectContents}/${id}`)
    .update({ lastScreenshotTime: firebaseAdmin.firestore.FieldValue.serverTimestamp() });
};
