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

import { Action } from '@ngrx/store';
import {
  ICommentThreadDocument,
  FirestoreChangeType,
  ICommentDocument,
  ITaggableTextFieldNode,
} from 'cd-interfaces';
import { remoteActionTag } from 'src/app/database/path.utils';

export const COMMENT_THREAD = '[Comment Thread]';
export const COMMENT = '[Comment]';

// COMMENT THREAD ACTIONS
// actions that come from firestore
export const COMMENT_THREAD_REMOTE = `${COMMENT_THREAD} ${remoteActionTag}`;
export const COMMENT_THREAD_REMOTE_ADDED = `${COMMENT_THREAD_REMOTE} ${FirestoreChangeType.Added}`;
export const COMMENT_THREAD_REMOTE_MODIFIED = `${COMMENT_THREAD_REMOTE} ${FirestoreChangeType.Modified}`;
export const COMMENT_THREAD_REMOTE_REMOVED = `${COMMENT_THREAD_REMOTE} ${FirestoreChangeType.Removed}`;

// actions from user that trigger side effects into firestore
export const COMMENT_THREAD_CREATE = `${COMMENT_THREAD} create`;
export const COMMENT_THREAD_CREATE_SUCCESS = `${COMMENT_THREAD} create success`;
export const COMMENT_THREAD_UPDATE = `${COMMENT_THREAD} update`;
export const COMMENT_THREAD_DELETE = `${COMMENT_THREAD} delete`;

// COMMENT ACTIONS
// actions that come from firestore
export const COMMENT_REMOTE = `${COMMENT} ${remoteActionTag}`;
export const COMMENT_REMOTE_ADDED = `${COMMENT_REMOTE} ${FirestoreChangeType.Added}`;
export const COMMENT_REMOTE_MODIFIED = `${COMMENT_REMOTE} ${FirestoreChangeType.Modified}`;
export const COMMENT_REMOTE_REMOVED = `${COMMENT_REMOTE} ${FirestoreChangeType.Removed}`;

// actions from user that trigger side effects into firestore
export const COMMENT_CREATE = `${COMMENT} create`;
export const COMMENT_CREATE_SUCCESS = `${COMMENT} create success`;
export const COMMENT_UPDATE = `${COMMENT} update`;
export const COMMENT_DELETE = `${COMMENT} delete`;
export const COMMENT_DELETE_SUCCESS = `${COMMENT} delete success`;

export const COMMENT_SET_COUNTS = `${COMMENT} set comment counts per target`;

// COMMENT THREAD ACTION CLASSES
export class CommentThreadCreate implements Action {
  readonly type = COMMENT_THREAD_CREATE;
  constructor(
    public body: Array<ITaggableTextFieldNode>,
    public targetId: string,
    public elementTargetId?: string
  ) {}
}

export class CommentThreadCreateSuccess implements Action {
  readonly type = COMMENT_THREAD_CREATE_SUCCESS;
  constructor(public payload: ICommentThreadDocument) {}
}

export class CommentThreadRemoteAdded implements Action {
  readonly type = COMMENT_THREAD_REMOTE_ADDED;
  constructor(public payload: ICommentThreadDocument) {}
}

export class CommentThreadUpdate implements Action {
  readonly type = COMMENT_THREAD_UPDATE;
  constructor(public id: string, public changes: Partial<ICommentThreadDocument>) {}
}

export class CommentThreadRemoteModified implements Action {
  readonly type = COMMENT_THREAD_REMOTE_MODIFIED;
  constructor(public payload: ICommentThreadDocument) {}
}

export class CommentThreadDelete implements Action {
  readonly type = COMMENT_THREAD_DELETE;
  constructor(public payload: ICommentThreadDocument) {}
}

export class CommentThreadRemoteRemoved implements Action {
  readonly type = COMMENT_THREAD_REMOTE_REMOVED;
  constructor(public payload: ICommentThreadDocument) {}
}

export class CommentCreate implements Action {
  readonly type = COMMENT_CREATE;
  constructor(public body: Array<ITaggableTextFieldNode>, public threadId: string) {}
}

export class CommentCreateSuccess implements Action {
  readonly type = COMMENT_CREATE_SUCCESS;
  constructor(public payload: ICommentDocument) {}
}

export class CommentRemoteAdded implements Action {
  readonly type = COMMENT_REMOTE_ADDED;
  constructor(public payload: ICommentDocument) {}
}

export class CommentUpdate implements Action {
  readonly type = COMMENT_UPDATE;
  constructor(public id: string, public changes: Partial<ICommentDocument>) {}
}

export class CommentRemoteModified implements Action {
  readonly type = COMMENT_REMOTE_MODIFIED;
  constructor(public payload: ICommentDocument) {}
}

export class CommentDelete implements Action {
  readonly type = COMMENT_DELETE;
  constructor(public id: string) {}
}

export class CommentDeleteSuccess implements Action {
  readonly type = COMMENT_DELETE_SUCCESS;
  constructor(public payload: ICommentDocument) {}
}

export class CommentRemoteRemoved implements Action {
  readonly type = COMMENT_REMOTE_REMOVED;
  constructor(public payload: ICommentDocument) {}
}

export class CommentSetCounts implements Action {
  readonly type = COMMENT_SET_COUNTS;
  constructor(public commentCounts: Map<string, number>) {}
}

export type CommentThreadActions =
  | CommentThreadCreate
  | CommentThreadCreateSuccess
  | CommentThreadRemoteAdded
  | CommentThreadUpdate
  | CommentThreadRemoteModified
  | CommentThreadDelete
  | CommentThreadRemoteRemoved
  | CommentCreate
  | CommentCreateSuccess
  | CommentRemoteAdded
  | CommentUpdate
  | CommentRemoteModified
  | CommentDelete
  | CommentDeleteSuccess
  | CommentRemoteRemoved
  | CommentSetCounts;
