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
import * as firebaseAdmin from 'firebase-admin';

/**
 * Load the all the documents and subcollections needed to contruct the full change request object
 */
export const loadChangeRequest = async (
  changeRequestSnapshot: functions.firestore.QueryDocumentSnapshot
): Promise<cd.IChangeRequest> => {
  // Load the parent change request document
  const changeRequest = changeRequestSnapshot.data() as cd.IChangeRequest;

  // Load the payload subcollection
  const [payloadSubCollection] = await changeRequestSnapshot.ref.listCollections();
  const payloadDocRefs = await payloadSubCollection.listDocuments();

  const payloadDocs = await Promise.all(
    payloadDocRefs.map((doc) => {
      const paylodDoc = doc.get();
      const setCollection = doc.collection(consts.FirebaseField.Sets);
      const setsDocList = setCollection.listDocuments();
      const updateCollection = doc.collection(consts.FirebaseField.Updates);
      const updatesDocList = updateCollection.listDocuments();
      return Promise.all([paylodDoc, setsDocList, updatesDocList]);
    })
  );

  // The the set and update subcollections within each payload document
  const payloadPromises = payloadDocs.map(async (p) => {
    const [paylodDoc, setsDocList, updatesDocList] = p;
    const payloadContent = paylodDoc.data() as cd.ChangePayload;
    const setDocs = await Promise.all(setsDocList.map((s) => s.get()));
    const updateDocs = await Promise.all(updatesDocList.map((u) => u.get()));
    const sets = setDocs.map((s) => s.data());
    const updates = updateDocs.map((u) => u.data());
    const payloadItem = { ...payloadContent, sets, updates } as cd.ChangePayload;
    return payloadItem;
  });

  const payload = await Promise.all(payloadPromises);

  return { ...changeRequest, payload };
};

/**
 * Delete a change requests and all of its subcollection documents
 */
export const deleteChangeRequest = async (
  changeRequestSnapshot: functions.firestore.QueryDocumentSnapshot
) => {
  const [payloadSubCollection] = await changeRequestSnapshot.ref.listCollections();
  const payloadRefs = await payloadSubCollection.listDocuments();
  const subCollections = await Promise.all(payloadRefs.map((r) => r.listCollections()));
  const subCollectionDocs = await Promise.all(subCollections.flat().map((c) => c.listDocuments()));

  const changeRequestDocDelete = changeRequestSnapshot.ref.delete();
  const payloadDocDeletes = payloadRefs.map((d) => d.delete());
  const subCollectionDocDeletes = subCollectionDocs.flat().map((d) => d.delete());

  await Promise.all([changeRequestDocDelete, ...payloadDocDeletes, ...subCollectionDocDeletes]);
};

/**
 * In , our convention is write a null values to object properties that should be removed.
 * When merging into Firestore, these null values need to be replace with the Firestore sentinel
 * value: FieldValue.Delete
 *
 * https://firebase.google.com/docs/reference/unity/class/firebase/firestore/field-value
 *
 * This function does a shallow search only. It only replaces null on top level properties rather
 * than recursing through entire object
 */
export const replaceNullValuesWithDeleteSentinel = (
  obj: Record<string, any>
): Record<string, any> => {
  const entries = Object.entries(obj);
  const updatedEntries = entries.map(([key, value]) => {
    if (value === null) return [key, firebaseAdmin.firestore.FieldValue.delete()];
    return [key, value];
  });
  return Object.fromEntries(updatedEntries);
};
