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
import * as consts from 'cd-common/consts';
import * as functions from 'firebase-functions';
import { firebaseApp } from './utils/firebase.utils';
import { flattenObjectWithDotNotation } from 'cd-common/utils';
import {
  deleteChangeRequest,
  loadChangeRequest,
  replaceNullValuesWithDeleteSentinel,
} from './utils/change-request.utils';

export const onChangeRequest = functions.firestore
  .document(`${consts.FirebaseCollection.ChangeRequests}/{documentId}`)
  .onCreate(async (changeRequestSnapshot: functions.firestore.QueryDocumentSnapshot) => {
    console.log('onChangeRequest');

    const changeRequest = await loadChangeRequest(changeRequestSnapshot);
    const firestore = firebaseApp.firestore();
    const { user, projectId, changeMarker, payload } = changeRequest;

    console.log('Loaded change request for projectId:  ' + projectId);

    await firestore.runTransaction(async (transaction) => {
      console.log(`Transactions initiated for ${changeMarker.id}`);

      // TODO: move path.utils so we can use here
      const projectPath = `projects/${projectId}`;
      const projectRef = firestore.doc(projectPath);
      const projectDoc = await transaction.get(projectRef);

      if (!projectDoc.exists) return transaction;
      const project = projectDoc.data() as cd.IProject;

      // Ignore change reqeust from from non-owner or editor
      const { owner, editors } = project;
      const isOwner = owner.id === user.id;
      const isEditor = user.email && editors?.includes(user.email);
      if (!isOwner && !isEditor) return transaction;

      // Apply sets, updates,deletes for each payload item
      for (const payloadItem of payload) {
        const { type, sets, updates, deletes } = payloadItem;

        // TODO: handle comment paths?
        const pathPrefix =
          type === cd.EntityType.Project
            ? consts.FirebaseCollection.Projects
            : consts.FirebaseCollection.ProjectContents;

        // TODO: Use changeMarker to filter out older updates
        // TODO: Generate change history document so that we can do this comparison
        if (sets) {
          for (const setRequest of sets) {
            const { id } = setRequest;
            const path = `${pathPrefix}/${id}`;
            const docRef = firestore.doc(path);
            transaction.set(docRef, setRequest);
          }
        }
        if (updates) {
          // TODO: Updates to nested properties need to be converted to dot notation
          // https://firebase.google.com/docs/firestore/manage-data/add-data#update_fields_in_nested_objects
          for (const updateRequest of updates) {
            const { id, update } = updateRequest;
            const path = `${pathPrefix}/${id}`;
            const docRef = firestore.doc(path);
            const dotNotationUpdate = flattenObjectWithDotNotation(update);
            const updateWithDeletes = replaceNullValuesWithDeleteSentinel(dotNotationUpdate);
            transaction.update(docRef, updateWithDeletes);
          }
        }
        if (deletes) {
          for (const id of deletes) {
            const path = `${pathPrefix}/${id}`;
            const docRef = firestore.doc(path);
            transaction.delete(docRef);
          }
        }
      }

      return transaction;
    });

    // after change has been processed delete it from the change requests collection
    await deleteChangeRequest(changeRequestSnapshot);
  });
