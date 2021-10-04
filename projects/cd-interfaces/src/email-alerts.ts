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

import { IUser } from './index';
import { ICommentDocument } from './comment';

export enum RecipientIsProjectOwner {
  True,
  False,
}

export interface ICommentEmailTemplateParts {
  heading: string;
  commentHtml: string;
  callToAction: string;
  footer: string;
}

export interface IRecipient {
  addressSpec: string;
}

export interface ISendEmailAlertResponse {
  id: string;
}

export interface IEmailAlertConfig {
  projectId: string;
  comments: ICommentDocument[];
}

export interface INewCommentEmailAlertConfig extends IEmailAlertConfig {
  commentOwner: IUser;
  createdAt: number;
  projectName: string | undefined;
  targetCommentId: string;
}

export interface IResolvedCommentEmailAlertConfig extends IEmailAlertConfig {
  resolved: boolean;
}

export interface ICommentEmailDetails {
  to: string[];
  subject: string;
  html: string;
}
