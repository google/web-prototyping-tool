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

import express from 'express';
import * as cd from 'cd-interfaces';
import * as serverConsts from '../../shared/consts/server.consts';
import { firestoreDb, getTimestamp } from '../../shared/utils/firebase.utils';
import { FirebaseCollection, PRESENCE_EXIT_PATH } from 'cd-common/consts';

const expressApp = express();
const END_POINT_PRESENCE_EXIT = `${PRESENCE_EXIT_PATH}/:sessionId/:msTimestamp`;

const handlePresenceExit = async (req: express.Request, res: express.Response) => {
  const sessionId: string = req.params.sessionId;
  const msTimestamp: string = req.params.msTimestamp;

  if (!sessionId || !msTimestamp) {
    return res.status(serverConsts.HttpStatus.BadRequest).send('Missing parameters');
  }

  try {
    await firestoreDb.runTransaction(async (transaction) => {
      const sessionDocPath = `${FirebaseCollection.UserPresence}/${sessionId}`;
      const sessionDocRef = firestoreDb.doc(sessionDocPath);
      const sessionDoc = await transaction.get(sessionDocRef);
      if (!sessionDoc.exists) return;

      // Don't delete if creationTime is newer than this request
      // It is possible that a user switched tabs back and forth very quickly
      // so we don't want to remove presence if the user has already switched back to the tab
      const msTimestampNum = parseInt(msTimestamp);
      const requestTime = getTimestamp(msTimestampNum);
      const sessionDocContents = sessionDoc.data() as cd.IUserPresence;
      if (sessionDocContents.creationTime > requestTime) {
        console.log('Session doc is newer than request time; Not removing presence');
        return;
      }

      console.log(`Removing presence for session: ${sessionId}`);
      transaction.delete(sessionDocRef);
    });

    res.status(serverConsts.HttpStatus.Ok);
  } catch (e) {
    console.error(e);
    res.status(serverConsts.HttpStatus.BadRequest).send('Removing session failed');
  }
};

// setup endpoints
expressApp.post(END_POINT_PRESENCE_EXIT, handlePresenceExit);

expressApp.listen(serverConsts.SERVER_PORT, () => {
  console.log(`Server listening on port ${serverConsts.SERVER_PORT}`);
});

process.on('unhandledRejection', (reason, _promise) => {
  console.log('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught exception at:', error.message);
});
