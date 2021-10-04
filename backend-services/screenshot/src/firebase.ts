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

import { QuerySnapshot } from '@google-cloud/firestore';
import { log, logError } from './log';
import * as admin from 'firebase-admin';
import * as cd from 'cd-interfaces';
import * as utils from './utils';
import * as fs from 'fs';
import { firestoreDb, bucket } from '../../shared/utils/firebase.utils';
import { SCREENSHOT_USERNAME } from '../../shared/environments/environment';
import {
  FirebaseCollection,
  SCREENSHOT_TASK_ID_PREFIX,
  ORIGINAL_SCREENSHOT_APP_ENGINE_LOCATION,
  FirebaseField,
} from 'cd-common/consts';

const TASK_RETRY_LIMIT = 3;

export const createScreenshotUserToken = (): Promise<string> => {
  return admin.auth().createCustomToken(SCREENSHOT_USERNAME);
};

const buildTaskPath = (targetId: string): string => {
  return `${FirebaseCollection.ScreenshotQueue}/${SCREENSHOT_TASK_ID_PREFIX}${targetId}`;
};

const buildTargetPath = (targetId: string): string => {
  return `${FirebaseCollection.ProjectContents}/${targetId}`;
};

export const checkForTask = (): Promise<QuerySnapshot> => {
  return firestoreDb
    .collection(FirebaseCollection.ScreenshotQueue)
    .orderBy(FirebaseField.CreatedAt)
    .limit(1)
    .get();
};

export const deleteTaskFromQueue = async (task: cd.IScreenshotTask): Promise<void> => {
  log(`Deleting task from queue: ${task.targetId}`);
  const taskPath = buildTaskPath(task.targetId);
  const taskDocRef = firestoreDb.doc(taskPath);
  return firestoreDb.runTransaction((transaction) => {
    transaction.delete(taskDocRef);
    return Promise.resolve();
  });
};

export const checkForTarget = (targetId: string): Promise<FirebaseFirestore.DocumentSnapshot> => {
  const targetPath = buildTargetPath(targetId);
  const targetDocRef = firestoreDb.doc(targetPath);
  return firestoreDb.runTransaction((transaction) => transaction.get(targetDocRef));
};

const getTaskDocRef = (task: cd.IScreenshotTask): FirebaseFirestore.DocumentReference => {
  const taskPath = buildTaskPath(task.targetId);
  return firestoreDb.doc(taskPath);
};

export const retryTask = (task: cd.IScreenshotTask) => {
  log(`Retry task called for: ${task.targetId}`);
  const newTaskDocumentRef = getTaskDocRef(task);
  return firestoreDb.runTransaction(async (transaction) => {
    try {
      const docs = await transaction.get(newTaskDocumentRef);
      const taskRetryCount = task.retryCount || 0;
      if (!docs.exists && taskRetryCount < TASK_RETRY_LIMIT) {
        log(`Retrying task for target: ${task.targetId}`);
        const update = Object.assign(task, { retryCount: taskRetryCount + 1 });
        transaction.create(newTaskDocumentRef, update);
      }
    } catch (err) {
      logError(err);
    }
  });
};

export const uploadScreenshot = async (screenshot: string, targetId: string): Promise<void> => {
  const destination = utils.constructDestination(targetId);
  await bucket.upload(screenshot, { destination, resumable: false });

  log(`Successfully generated screenshot for ${targetId}`);
  fs.unlinkSync(ORIGINAL_SCREENSHOT_APP_ENGINE_LOCATION);
  return Promise.resolve();
};
