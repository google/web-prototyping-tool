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

import { firebaseApp } from './firebase.utils';
import { FirebaseCollection, FirebaseField, FirebaseQueryOperation } from 'cd-common/consts';
import * as cd from 'cd-interfaces';
import * as consts from '../consts/firebase.consts';

export const getCommentThreadsInProject = async (projectId: string) => {
  const firestore = firebaseApp.firestore();
  let commentThreads: cd.ICommentThreadDocument[] = [];

  await firestore
    .collection(FirebaseCollection.Comments)
    .where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, projectId)
    .where(FirebaseField.DocumentType, FirebaseQueryOperation.Equals, consts.COMMENT_THREAD)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        console.log(consts.NO_MATCHING_DOCUMENTS);
        return;
      }

      snapshot.forEach((doc) => {
        commentThreads = [...commentThreads, doc.data() as cd.ICommentThreadDocument];
      });
    });

  return commentThreads;
};

export const getCommentsInProject = async (projectId: string) => {
  const firestore = firebaseApp.firestore();
  let comments: cd.ICommentDocument[] = [];

  await firestore
    .collection(FirebaseCollection.Comments)
    .where(FirebaseField.DocumentId, FirebaseQueryOperation.Equals, projectId)
    .where(FirebaseField.DocumentType, FirebaseQueryOperation.Equals, consts.COMMENT)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        console.log(consts.NO_MATCHING_DOCUMENTS);
        return;
      }

      snapshot.forEach((doc) => {
        comments = [...comments, doc.data() as cd.ICommentDocument];
      });
    });
  return comments;
};

export const getCommentsInThread = async (threadId: string) => {
  const firestore = firebaseApp.firestore();
  let comments: cd.ICommentDocument[] = [];

  await firestore
    .collection(FirebaseCollection.Comments)
    .where(FirebaseField.ThreadId, FirebaseQueryOperation.Equals, threadId)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        console.log(consts.NO_MATCHING_DOCUMENTS);
        return;
      }

      snapshot.forEach((doc) => {
        comments = [...comments, doc.data() as cd.ICommentDocument];
      });
    });

  return comments;
};

export const getCommentTargetId = async (commentDoc: cd.ICommentDocument) => {
  const firestore = firebaseApp.firestore();
  const threadId = commentDoc.threadId;

  const threadRef = await firestore.collection(FirebaseCollection.Comments).doc(threadId).get();
  if (!threadRef.exists) return;

  const threadData = threadRef.data();
  if (!threadData) return;

  return threadData.targetId;
};

export const getProject = async (projectId: string): Promise<cd.IProject | undefined> => {
  const firestore = firebaseApp.firestore();

  const projectPath = `projects/${projectId}`;
  const projectDoc = await firestore.doc(projectPath).get();
  const project = projectDoc.exists ? (projectDoc.data() as cd.IProject) : undefined;

  if (!project) console.log(consts.NO_MATCHING_DOCUMENTS);

  return project;
};

export const getThread = async (
  threadId: string
): Promise<cd.ICommentThreadDocument | undefined> => {
  const firestore = firebaseApp.firestore();

  const threadRef = await firestore.collection(FirebaseCollection.Comments).doc(threadId).get();
  if (!threadRef.exists) return;

  const threadData = threadRef.data();
  if (!threadData) return;

  return threadData as cd.ICommentThreadDocument;
};

export const sortByDate = (comments: cd.ICommentDocument[]) =>
  comments.slice().sort((a, b) => a.createdAt - b.createdAt);

export const getThreadOwnerForComment = async (commentDoc: cd.ICommentDocument) => {
  const thread = await getThread(commentDoc.threadId);

  return thread?.owner;
};

export const getProjectOwner = async (commentDoc: cd.ICommentDocument) => {
  const { projectId } = commentDoc;
  const projectDoc = await getProject(projectId);

  if (!projectDoc) return;
  return projectDoc.owner;
};
