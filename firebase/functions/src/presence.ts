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
import * as functions from 'firebase-functions';
import * as consts from 'cd-common/consts';
import type { IUserPresence } from 'cd-interfaces';
import { createTimestamp, firebaseApp } from './utils/firebase.utils';
import { FirebaseCollection } from 'cd-common/consts';

const TWENTY_SECONDS = 20 * 1000;

export const presenceDetection = functions.pubsub.schedule('every 2 minutes').onRun(async () => {
  const firestore = firebaseApp.firestore();
  const presenceQuery = await firestore.collection(FirebaseCollection.UserPresence).get();
  const deletePromises: Promise<any>[] = [];
  const now = createTimestamp();

  for (const presenceRef of presenceQuery.docs) {
    const presence = presenceRef.data() as IUserPresence;
    const { pollTime } = presence;
    const timeSinceLastPoll = now.toMillis() - pollTime.toMillis();

    console.log('Checking time since last poll', timeSinceLastPoll);

    // If poll time is more than 20 seconds old - delete
    if (timeSinceLastPoll > TWENTY_SECONDS) {
      console.log('Removing user presence', presence.user.id);
      deletePromises.push(presenceRef.ref.delete());
    }
  }

  await Promise.all(deletePromises);
});

/** Anytime a user's presence departs, cleanup any associated Rtc documents */
export const onPresenceDeparture = functions.firestore
  .document(`${consts.FirebaseCollection.UserPresence}/{documentId}`)
  .onDelete(async (snapshot: functions.firestore.QueryDocumentSnapshot) => {
    const presence = snapshot.data() as cd.IUserPresence;
    const { sessionId } = presence;
    const firestore = firebaseApp.firestore();

    const fromConnections = firestore
      .collection(consts.FirebaseCollection.RtcConnections)
      .where(consts.FirebaseField.fromSessionId, consts.FirebaseQueryOperation.Equals, sessionId)
      .get();

    const toConnections = firestore
      .collection(consts.FirebaseCollection.RtcConnections)
      .where(consts.FirebaseField.toSessionId, consts.FirebaseQueryOperation.Equals, sessionId)
      .get();

    const queryResults = await Promise.all([fromConnections, toConnections]);
    const docs = queryResults.flatMap((r) => r.docs.map((d) => d.ref));
    const subCollections = await Promise.all(docs.map((d) => d.listCollections()));
    const subDocs = await Promise.all(subCollections.flat().map((s) => s.listDocuments()));

    // Delete all connection docs and subcollection docs
    const allDocs = [...docs, ...subDocs.flat()];
    const deletes = allDocs.map((d) => d.delete());
    await Promise.all(deletes);
  });
