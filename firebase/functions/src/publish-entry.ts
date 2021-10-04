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
import { firebaseFunctions, firebaseApp } from './utils/firebase.utils';

// Delete all projects contained within a publish entry (i.e. each version)
export const onPublishEntryDelete = firebaseFunctions.firestore
  .document(`${FirebaseCollection.PublishEntries}/{docId}`)
  .onDelete(async (change) => {
    const { versions } = change.data() as cd.IPublishEntry;
    const projectIdsToDelete = versions.map((v) => v.projectId);
    const firestore = firebaseApp.firestore();

    try {
      // delete each project
      // deleting of project contents is handled in separate function in project.ts
      for (const id of projectIdsToDelete) {
        await firestore.doc(`${FirebaseCollection.Projects}/${id}`).delete();
      }

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  });
