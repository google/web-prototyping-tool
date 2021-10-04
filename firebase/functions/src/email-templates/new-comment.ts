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
import * as consts from '../consts/email-alerts.consts';
import * as firebaseUtils from '../utils/firebase.utils';
import * as templateUtils from '../utils/email-template.utils';

export const createHtmlForNewComment = async (
  data: cd.INewCommentEmailAlertConfig,
  targetId: string,
  isOwner = false,
  isReply = false
) => {
  const { commentOwner, projectId, comments, targetCommentId, projectName } = data;

  if (!commentOwner.id) return;

  const commentOwnerUser = await firebaseUtils.getUser(commentOwner.id);
  const { name } = commentOwnerUser as cd.IUser;
  const callToAction = templateUtils.createCallToAction(projectId, targetId);

  const headingText = generateHeadingText(name, projectName, isOwner, isReply);
  const heading = templateUtils.createHeading(headingText);

  const footer = templateUtils.createFooter();

  let commentHtml = '';
  for (const comment of comments) {
    commentHtml += await templateUtils.createComment(comment, targetCommentId);
  }

  return templateUtils.createNewCommentTemplate({ heading, commentHtml, callToAction, footer });
};

const generateHeadingText = (
  name: string | null | undefined,
  projectName: string | undefined,
  isOwner: boolean,
  isReply: boolean
) => {
  const user = name || 'Someone';
  const defaultProjectText = isOwner ? 'a project you own' : 'a project';
  const project = projectName || defaultProjectText;
  const content = isReply ? 'replied to your' : 'made a';

  return `${user} ${content} comment in ${project} on ${consts.NAME}`;
};
