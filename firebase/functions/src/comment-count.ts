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

import * as consts from 'cd-common/consts';
import * as utils from './utils/firebase.utils';
import * as commentUtils from './utils/comments.utils';
import { COMMENT, COMMENT_THREAD } from './consts/firebase.consts';
import { getProjectsDocRef } from './utils/firestore.utils';

export const onCommentCreateUpdateCount = utils.firebaseFunctions.firestore
  .document(`${consts.FirebaseCollection.Comments}/{docId}`)
  .onCreate(async (change) => {
    const commentDoc = change.data();

    if (!commentDoc) return;
    if (commentDoc.type === COMMENT_THREAD) return;

    const { projectId } = commentDoc;
    updateCommentCount(projectId);

    return;
  });

export const onCommentDeleteUpdateCount = utils.firebaseFunctions.firestore
  .document(`${consts.FirebaseCollection.Comments}/{docId}`)
  .onDelete(async (change) => {
    const commentDoc = change.data();

    if (!commentDoc) return;
    if (commentDoc.type === COMMENT_THREAD) return;

    const { projectId } = commentDoc;

    if (!projectId) return;
    updateCommentCount(projectId);

    return;
  });

export const onCommentResolutionChangeUpdateCount = utils.firebaseFunctions.firestore
  .document(`${consts.FirebaseCollection.Comments}/{docId}`)
  .onUpdate(async (change) => {
    const beforeCommentDoc = change.before.data();
    const afterCommentDoc = change.after.data();

    if (!beforeCommentDoc || !afterCommentDoc) return;
    if (afterCommentDoc.type === COMMENT) return;
    if (beforeCommentDoc.resovled === afterCommentDoc.resolved) return;

    const { projectId } = afterCommentDoc;
    updateCommentCount(projectId);

    return;
  });

const updateCommentCount = async (projectId: string) => {
  const docRef = getProjectsDocRef(projectId);
  if (!docRef) return;

  const allThreads = await commentUtils.getCommentThreadsInProject(docRef.id);
  if (allThreads.length === 0) return;

  const projectDoc = (await docRef.get()).data();
  const boardIds: string[] = projectDoc?.boardIds;
  const threads = allThreads.filter((thread) => {
    return thread.resolved === false && boardIds.includes(thread.targetId);
  });

  let numComments = 0;
  for (const thread of threads) {
    const comments = await commentUtils.getCommentsInThread(thread.id);
    numComments += comments.length;
  }

  await docRef.update({ numComments });
};
