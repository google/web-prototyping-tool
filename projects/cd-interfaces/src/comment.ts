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

import { IProjectContentDocument } from './project';
import { EntityType } from './entity-types';
import { IUser, IUserIdentity } from './index';
import { ITaggableTextFieldNode } from './taggable-text-field';

export interface INewCommentThread {
  body: Array<ITaggableTextFieldNode>;
  id?: string;
}

export interface ICommentThreadDocument extends IProjectContentDocument {
  type: EntityType.CommentThread;
  owner: IUserIdentity;
  targetId: string;
  resolved?: boolean;
  elementTargetId?: string;
}

export interface ICommentDocument extends IProjectContentDocument {
  createdAt: number;
  owner: IUser;
  body: Array<ITaggableTextFieldNode>;
  threadId: string;
  type: EntityType.Comment;
  updatedAt: number;
}

export interface ICommentThread extends ICommentThreadDocument {
  comments: IComment[];
}

export interface IComment extends ICommentDocument {
  user: IUser;
}
