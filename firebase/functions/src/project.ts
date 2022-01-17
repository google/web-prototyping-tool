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
import { FirebaseCollection, FirebaseField, FirebaseQueryOperation } from 'cd-common/consts';
import { firebaseFunctions, firebaseApp } from './utils/firebase.utils';

const SCREENSHOTS = 'screenshots';

export const onProjectDelete = firebaseFunctions.firestore
  .document(`${FirebaseCollection.Projects}/{docId}`)
  .onDelete(async (change) => {
    const { id, boardIds, symbolIds } = change.data() as cd.IProject;
    const screenshotIds = [...boardIds, ...symbolIds];
    const firestore = firebaseApp.firestore();

    try {
      const docsToDelete = await firestore
        .collection(FirebaseCollection.ProjectContents)
        .where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, id)
        .get();

      // Delete project contents
      for (const doc of docsToDelete.docs) {
        const docData = doc.data() as cd.IProjectContentDocument;
        await firestore.doc(`${FirebaseCollection.ProjectContents}/${docData.id}`).delete();
      }

      // Delete all project screenshots
      for (const screenshotId of screenshotIds) {
        await firebaseApp
          .storage()
          .bucket()
          .deleteFiles({ prefix: `${SCREENSHOTS}/${screenshotId}` });
      }

      // Delete all project comments
      const commentsToDelete = await firestore
        .collection(FirebaseCollection.Comments)
        .where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, id)
        .get();

      // Delete project contents
      for (const doc of commentsToDelete.docs) {
        const docData = doc.data() as any;
        await firestore.doc(`${FirebaseCollection.Comments}/${docData.id}`).delete();
      }

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  });
