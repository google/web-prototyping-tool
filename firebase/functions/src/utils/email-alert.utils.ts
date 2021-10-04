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
import * as consts from '../consts/firebase.consts';
import * as emailConsts from '../consts/email-alerts.consts';
import * as utils from '../utils/email-alert.utils';
import { createHtmlForNewComment } from '../email-templates/new-comment';
import { createHtmlForResolutionStateChange } from '../email-templates/updated-comment';
import { getProject } from './comments.utils';
import { FirebaseCollection, FirebaseField, FirebaseQueryOperation } from 'cd-common/consts';
import { firebaseApp } from './firebase.utils';

const DEFAULT_OWNER_MSG = 'Someone made a comment in your project';
const DEFAULT_REPLY_MSG = 'Someone replied to your comment';
const DEFAULT_THREAD_MSG = 'Someone replied to your thread';
const DEFAULT_MENTION_MSG = 'You were mentioned';

const generateSubject = (msg: string) => `${msg} on ${emailConsts.NAME}`;

export const createListOfAllTaggedUsersInThread = async (comments: cd.ICommentDocument[]) => {
  let userList: string[] = [];

  for (const comment of comments) {
    userList = [...userList, ...getListOfTaggedUsers(comment.body)];
  }

  return userList;
};

export const getAllCommentsInThread = async (threadId: string) => {
  const firestore = firebaseApp.firestore();
  const commentList: cd.ICommentDocument[] = [];

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
        commentList.push(<cd.ICommentDocument>doc.data());
      });
    });

  return commentList;
};

export const getLastCommentsInThread = async (threadId: string) => {
  const firestore = firebaseApp.firestore();
  const commentList: cd.ICommentDocument[] = [];
  await firestore
    .collection(FirebaseCollection.Comments)
    .where(FirebaseField.ThreadId, FirebaseQueryOperation.Equals, threadId)
    .orderBy(FirebaseField.LastUpdatedAt)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        console.log(consts.NO_MATCHING_DOCUMENTS);
        return;
      }

      snapshot.forEach((doc) => {
        commentList.push(<cd.ICommentDocument>doc.data());
      });
    });

  return commentList.length === 1
    ? commentList
    : [commentList[commentList.length - 2], commentList[commentList.length - 1]];
};

export const getEmailDetailsForOwner = async (
  commentDoc: cd.ICommentDocument,
  commentTargetId: string
) => {
  const isOwner = true;
  const { createdAt, id, owner, projectId, threadId } = commentDoc;

  const subject = generateSubject(DEFAULT_OWNER_MSG);
  const comments = await getLastCommentsInThread(threadId);
  const projectDoc = await getProject(projectId);

  if (!projectDoc) return {};
  const projectName = projectDoc.name;
  const projectOwner: Partial<cd.IUser> = projectDoc.owner;

  const to = [projectOwner.email];

  const templateData: cd.INewCommentEmailAlertConfig = {
    projectId,
    commentOwner: owner,
    createdAt,
    comments,
    targetCommentId: id,
    projectName,
  };
  const html = await createHtmlForNewComment(templateData, commentTargetId, isOwner);

  return { to, subject, html };
};

export const getEmailDetailsForThreadOwner = async (
  commentDoc: cd.ICommentDocument,
  commentTargetId: string,
  toUser: cd.IUserIdentity
) => {
  const isThreadOwner = true;
  const { createdAt, id, owner, projectId, threadId } = commentDoc;

  const subject = generateSubject(DEFAULT_THREAD_MSG);
  const comments = await getLastCommentsInThread(threadId);
  const projectDoc = await getProject(projectId);

  if (!projectDoc) return {};
  const projectName = projectDoc.name;

  const to = [toUser.email];

  const templateData: cd.INewCommentEmailAlertConfig = {
    projectId,
    commentOwner: owner,
    createdAt,
    comments,
    targetCommentId: id,
    projectName,
  };
  const html = await createHtmlForNewComment(templateData, commentTargetId, isThreadOwner);

  return { to, subject, html };
};

export const getEmailDetailsForRepliedToComment = async (
  commentDoc: cd.ICommentDocument,
  commentTargetId: string,
  toUser: cd.IUserIdentity
) => {
  const isReply = true;
  // Even if the reply is to a thread owner,
  // we want the subject to tell the user the comment
  // is a reply.
  const isOwner = false;
  const { createdAt, id, owner, projectId, threadId } = commentDoc;
  const subject = generateSubject(DEFAULT_REPLY_MSG);
  const comments = await getLastCommentsInThread(threadId);
  const projectDoc = await getProject(projectId);

  if (!projectDoc) return {};
  const projectName = projectDoc.name;

  const to = [toUser.email];

  const templateData: cd.INewCommentEmailAlertConfig = {
    projectId,
    commentOwner: owner,
    createdAt,
    comments,
    targetCommentId: id,
    projectName,
  };
  const html = await createHtmlForNewComment(templateData, commentTargetId, isOwner, isReply);

  return { to, subject, html };
};

export const getEmailDetailsForTaggedUser = async (
  commentDoc: cd.ICommentDocument,
  targetId: string
) => {
  const { body, createdAt, id, owner, projectId, threadId } = commentDoc;

  const to = getListOfTaggedUsers(body);
  const subject = generateSubject(DEFAULT_MENTION_MSG);
  const comments = await getLastCommentsInThread(threadId);
  const projectDoc = await getProject(projectId);

  if (!projectDoc) return {};
  const projectName = projectDoc.name;

  const templateData: cd.INewCommentEmailAlertConfig = {
    projectId,
    commentOwner: owner,
    createdAt,
    comments,
    targetCommentId: id,
    projectName,
  };
  const html = await createHtmlForNewComment(templateData, targetId);

  return { to, subject, html };
};

export const getEmailDetailsForTaggedUserInThread = async (
  projectDoc: cd.IProject,
  afterDoc: cd.ICommentThreadDocument,
  resolved: any,
  targetId: string
) => {
  const projectId = (projectDoc as cd.IProject).id;
  const projectName = (projectDoc as cd.IProject).name || 'A project';
  const comments = await utils.getAllCommentsInThread(afterDoc.id);
  const to = await utils.createListOfAllTaggedUsersInThread(comments);
  const subject = `${projectName} has changed on ${emailConsts.NAME}`;

  const templateData: cd.IResolvedCommentEmailAlertConfig = {
    projectId,
    comments,
    resolved,
  };
  const html = await createHtmlForResolutionStateChange(templateData, targetId);

  return { to, subject, html };
};

export const getListOfTaggedUsers = (commentBody: cd.ITaggableTextFieldNode[]): string[] => {
  return commentBody.reduce<string[]>((acc, item) => {
    if (item.type !== cd.TextFieldElementType.Chip) return acc;

    const { email } = item.content as cd.IUser;

    if (!email) return acc;
    acc.push(email);

    return acc;
  }, []);
};
