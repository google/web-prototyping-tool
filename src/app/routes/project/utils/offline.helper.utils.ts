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

import { getLocalDataForProject } from 'src/app/database/workers/offline.utils';
import firebase from 'firebase/app';
import * as cd from 'cd-interfaces';

const convertFirebaseTimestamp = (ts: firebase.firestore.Timestamp) => {
  return new firebase.firestore.Timestamp(ts.seconds, ts.nanoseconds);
};

export const getLocalProjectDataForId = (
  projectId: string,
  disabled?: boolean
): Promise<cd.IProjectContent | undefined> => {
  return getLocalDataForProject(projectId, disabled).then((data) => {
    if (!data) return data;
    const updatedAt = data.project?.updatedAt;
    if (updatedAt) {
      data.project.updatedAt = convertFirebaseTimestamp(updatedAt);
    }
    const createdAt = data.project?.createdAt;
    if (createdAt) {
      data.project.createdAt = convertFirebaseTimestamp(createdAt);
    }
    return data;
  });
};
