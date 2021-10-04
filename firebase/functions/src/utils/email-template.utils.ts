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
import * as utils from 'cd-common/utils';
import * as firebaseUtils from './firebase.utils';
import { APP_URL, EMAIL_GRAYSCALE_LOGO_URL } from '../environments/environment';

export const createCallToAction = (projectId: string, targetId: string) => {
  return `
    <div style="display: block; text-align: center; padding: 12px 0 30px 0; border-bottom: 1px solid #dadce0; font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">
      <a 
          style="display: inline-block; background-color: #7c4dff; border-radius: 3px; padding: 5px 12px; font-size: 14px; font-weight:normal; font-family:'Google Sans',Roboto,sans-serif; text-decoration:none; color: white; cursor: pointer;"
          href="${createProjectPreviewUrl(
            projectId,
            targetId,
            cd.PreviewAnalyticsParam.EmailAlert
          )}">View</a>
    </div> 
  `;
};

export const createComment = async (
  comment: cd.ICommentDocument,
  targetId?: string
): Promise<string> => {
  const isTargetComment = comment.id === targetId;

  if (!comment.owner.id) return '';

  const commentOwnerUser = await firebaseUtils.getUser(comment.owner.id);
  const { name, photoUrl } = commentOwnerUser as cd.IUser;

  let commentBody = '';

  for (const commentPart of comment.body) {
    commentBody += `${createCommentBodyPart(commentPart, isTargetComment)} `;
  }

  return `<div style="padding: 16px; margin-bottom: 18px; max-width: 550px; border: 2px solid ${
    isTargetComment ? 'rgba(180, 124, 255, .5)' : '#e0e1e4'
  }; border-radius: 8px;">
      ${buildCommentHeader(<string>name, <string>photoUrl)}
      ${buildCommentBody(commentBody)}
    </div>`;
};

export const createFooter = () => {
  return `
    <div style="box-sizing: border-box; padding: 0 12px; text-align: center;">
      <div style="display: inline-block; padding: 40px 0 20px 0; height: 24px;" >
        <img style="width: 29px; height: 20px;" src="${EMAIL_GRAYSCALE_LOGO_URL}" />
        <div style="display: inline-block; font-weight: 400; font-size: 15px; font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif; color: #717171; vertical-align: top;"></div>
      </div>
      <p style="margin: 0; font-size: 13px; font-weight: 400; line-height: 18px; font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif; color: #aaa; text-align: center;">Google LLC</p>
      <p style="margin: 0; font-size: 13px; font-weight: 400; line-height: 18px; font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif; color: #aaa; text-align: center">1600 Amphitheater Parkway, Mountain View, CA 94043, USA</p>
    </div>
  `;
};

export const createHeading = (headingText: string): string => {
  return `
    <h2 style="margin: 0; margin-bottom: 30px; font-weight: 400; font-size: 22px; color: #202124; font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;">
      ${headingText}
    </h2>
  `;
};

export const createNewCommentTemplate = (templateParts: cd.ICommentEmailTemplateParts) => {
  const { heading, commentHtml, callToAction, footer } = templateParts;
  return `
    <div style="width: 100%;">
      <div style="box-sizing: border-box; max-width: 700px; padding: 28px; margin: 0 auto;">
        ${heading}
        ${commentHtml} 
        ${callToAction}
        ${footer}
      </div>
    </div>
 `;
};

export const createProjectPreviewUrl = (
  projectId: string,
  targetId: string,
  analyticsParam: cd.PreviewAnalyticsParam
): string => {
  return `${APP_URL}/project/${projectId}/preview?analyticsEvent=${analyticsParam}&comments=true&id=${targetId}`;
};

const buildCommentBody = (commentBody: string) => {
  return `
    <div style="padding: 8px 0; font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif; font-size: 14px; line-height: 24px; color: #5f6368;">
      ${commentBody}
    </div>
  `;
};

const buildCommentHeader = (name: string, photoUrl: string): string => {
  return `
    <div> 
      <div style="display: inline-block; width: 32px; height: 32px;">
        <img style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" src="${utils.getAvatarUrl(
          photoUrl
        )}" /> 
      </div>
      <div style="display: inline-block; width: 80%; height: 32px; padding: 5px 0 0 8px; vertical-align: top;">
        <div style="font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif; font-size: 14px; font-weight: 500; color: #202124;">${name}</div>
      </div>
    </div>
  `;
};

const buildChip = ({ name }: cd.IUser, isTargetComment: boolean): string => {
  return `<span style="border: 1px solid ${
    isTargetComment ? 'rgba(180, 124, 255, .5)' : '#e0e1e4'
  }; border-radius: 24px; padding: 1px 6px; font-size: 12px; font-weight: 500; white-space: nowrap;">+${name}</span>`;
};

const buildLinkNode = (content: string): string => {
  return `${content}`;
};

const BREAK_TAG = '<br>';

const createCommentBodyPart = (
  part: cd.ITaggableTextFieldNode,
  isTargetComment: boolean
): string => {
  switch (part.type) {
    case cd.TextFieldElementType.Break:
      return BREAK_TAG;
    case cd.TextFieldElementType.Chip:
      return buildChip(<cd.IUser>part.content, isTargetComment);
    case cd.TextFieldElementType.Link:
      return buildLinkNode(<string>part.content);
    case cd.TextFieldElementType.Text:
      return <string>part.content;
  }
};
