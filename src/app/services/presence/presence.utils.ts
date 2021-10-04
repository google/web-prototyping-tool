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

import type { IUser, IUserPresence } from 'cd-interfaces';
import { environment } from 'src/environments/environment';
import { PRESENCE_EXIT_PATH } from 'cd-common/consts';
import firebase from 'firebase/app';
import 'firebase/firestore';

export const constructPresenceDoc = (
  user: IUser,
  projectId: string,
  sessionId: string
): IUserPresence => {
  const creationTime = firebase.firestore.Timestamp.now();
  const pollTime = firebase.firestore.Timestamp.now();

  return {
    user,
    projectId,
    sessionId,
    creationTime,
    pollTime,
  };
};

export const constructPresenceExitUrl = (sessionId: string) => {
  const { presenceServiceUrl } = environment;
  const msTimestamp = firebase.firestore.Timestamp.now().toMillis();
  return `${presenceServiceUrl}/${PRESENCE_EXIT_PATH}/${sessionId}/${msTimestamp}`;
};
