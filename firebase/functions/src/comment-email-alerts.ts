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

import { PubSub } from '@google-cloud/pubsub';

import * as cd from 'cd-interfaces';
import * as env from './environments/environment';
import * as utils from './utils/email-alert.utils';
import * as commentUtils from './utils/comments.utils';
import { FirebaseCollection } from 'cd-common/consts';
import { firebaseFunctions } from './utils/firebase.utils';

export const onCommentCreate = firebaseFunctions.firestore
  .document(`${FirebaseCollection.Comments}/{docId}`)
  .onCreate(async (change) => {
    const commentDoc: cd.ICommentDocument = change.data() as cd.ICommentDocument;

    if (commentDoc.type !== cd.EntityType.Comment) return;

    const taggedUsers = utils.getListOfTaggedUsers(commentDoc.body);
    const commentTargetId = await commentUtils.getCommentTargetId(commentDoc);

    if (taggedUsers.length > 0) {
      const taggedUserEmailDetails = await utils.getEmailDetailsForTaggedUser(
        commentDoc,
        commentTargetId
      );

      await publishEmailDetails(taggedUserEmailDetails);
    }

    const projectOwner = await commentUtils.getProjectOwner(commentDoc);

    if (commentDoc.owner.id !== projectOwner?.id) sendOwnerEmailUpdate(commentDoc, commentTargetId);

    // Do not proceed if there are no replies in thread
    const commentsInThread = await commentUtils.getCommentsInThread(commentDoc.threadId);
    if (commentsInThread.length <= 1) return;

    const sortedComments = commentUtils.sortByDate(commentsInThread);
    const createdCommentIndex = sortedComments.findIndex((comment) => comment.id === commentDoc.id);
    const previousComment = sortedComments[createdCommentIndex - 1];
    const thread = await commentUtils.getThread(commentDoc.threadId);
    const threadOwner = thread?.owner;

    if (previousComment?.owner?.id !== commentDoc?.owner?.id)
      sendRepliedUserEmailUpdate(commentDoc, commentTargetId, previousComment.owner);

    if (threadOwner?.id !== commentDoc.owner.id)
      sendThreadOwnerEmailUpdate(commentDoc, commentTargetId);

    return;
  });

export const onCommentUpdate = firebaseFunctions.firestore
  .document(`${FirebaseCollection.Comments}/{docId}`)
  .onUpdate(async (change) => {
    const { before, after } = change;
    const afterDoc = after.data() as cd.ICommentDocument | cd.ICommentThreadDocument;
    const beforeDoc = before.data() as cd.ICommentDocument | cd.ICommentThreadDocument;

    if (
      beforeDoc.type === cd.EntityType.CommentThread &&
      beforeDoc.resolved !== (<cd.ICommentThreadDocument>afterDoc).resolved
    ) {
      const { resolved, targetId } = afterDoc as cd.ICommentThreadDocument;
      if (resolved === undefined) return;

      const projectDoc = await commentUtils.getProject(afterDoc.projectId);
      if (!projectDoc) return;

      const taggedUserEmailDetails = await utils.getEmailDetailsForTaggedUserInThread(
        projectDoc,
        <cd.ICommentThreadDocument>afterDoc,
        resolved,
        targetId
      );

      await publishEmailDetails(taggedUserEmailDetails);

      return;
    }

    if (beforeDoc.type === cd.EntityType.CommentThread) return;

    const commentTargetId = await commentUtils.getCommentTargetId(<cd.ICommentDocument>afterDoc);
    const userEmailDetails = await utils.getEmailDetailsForTaggedUser(
      <cd.ICommentDocument>afterDoc,
      commentTargetId
    );

    await publishEmailDetails(userEmailDetails);

    return;
  });

const publishEmailDetails = async (emailDetails: {}) => {
  const pubSubClient = new PubSub();

  const serializedEmailDetails = JSON.stringify(emailDetails);
  const emailDetailsBuffer = Buffer.from(serializedEmailDetails);

  const messageId = await pubSubClient
    .topic(env.COMMENT_TAG_PUB_SUB_TOPIC)
    .publish(emailDetailsBuffer);
  console.log(`Message: ${messageId} published`);
};

const sendOwnerEmailUpdate = async (commentDoc: cd.ICommentDocument, commentTargetId: string) => {
  const { projectId, owner } = commentDoc;
  const projectDoc = await commentUtils.getProject(projectId);

  if (!projectDoc) return;
  const projectOwner: Partial<cd.IUser> = projectDoc.owner;

  if (projectOwner.email === owner.email) return;
  const ownerEmailDetails = await utils.getEmailDetailsForOwner(commentDoc, commentTargetId);

  await publishEmailDetails(ownerEmailDetails);

  return;
};

const sendThreadOwnerEmailUpdate = async (
  commentDoc: cd.ICommentDocument,
  commentTargetId: string
) => {
  const threadOwner = await commentUtils.getThreadOwnerForComment(commentDoc);

  if (!threadOwner || threadOwner.id === commentDoc.owner.id) return;

  const threadOwnerEmailDetails = await utils.getEmailDetailsForThreadOwner(
    commentDoc,
    commentTargetId,
    threadOwner
  );

  await publishEmailDetails(threadOwnerEmailDetails);

  return;
};

const sendRepliedUserEmailUpdate = async (
  commentDoc: cd.ICommentDocument,
  commentTargetId: string,
  repliedToUser: cd.IUserIdentity
) => {
  const threadOwner = await commentUtils.getThreadOwnerForComment(commentDoc);

  // Don't send if the reply is to the same person, or the owner of the thread.
  if (threadOwner?.id === commentDoc.owner.id || threadOwner?.id === repliedToUser.id) return;

  const repliedUserEmailDetails = await utils.getEmailDetailsForRepliedToComment(
    commentDoc,
    commentTargetId,
    repliedToUser
  );

  await publishEmailDetails(repliedUserEmailDetails);

  return;
};
