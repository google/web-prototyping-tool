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

import { IReducerFunctionLookup, ICommentThreadDocument, ICommentDocument } from 'cd-interfaces';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import * as actions from '../actions';

export const commentThreadAdapter = createEntityAdapter<ICommentThreadDocument>();
export const commentAdapter = createEntityAdapter<ICommentDocument>();

export interface ICommentsState {
  commentThreads: EntityState<ICommentThreadDocument>;
  comments: EntityState<ICommentDocument>;
  commentsMap: Map<string, string[]>; // map from thread id to list of comment id for it
  commentCounts: Map<string, number>; // map from target to number of unresovled comments for it
}

export const initialState: ICommentsState = {
  commentThreads: commentThreadAdapter.getInitialState(),
  comments: commentAdapter.getInitialState(),
  commentsMap: new Map(),
  commentCounts: new Map(),
};

// COMMENT THREAD REDUCERS
const handleCommentThreadAdded = (
  state: ICommentsState,
  { payload }: actions.CommentThreadCreateSuccess
): ICommentsState => {
  return {
    ...state,
    commentThreads: commentThreadAdapter.addOne(payload, state.commentThreads),
  };
};

const handleCommentThreadUpdate = (
  state: ICommentsState,
  { id, changes: updates }: actions.CommentThreadUpdate
): ICommentsState => {
  const update = { id, changes: updates };
  return {
    ...state,
    commentThreads: commentThreadAdapter.updateOne(update, state.commentThreads),
  };
};

// Copy of handleCommentThreadUpdate
const handleCommentThreadRemoteModified = (
  state: ICommentsState,
  { payload }: actions.CommentThreadRemoteModified
): ICommentsState => {
  const update = { id: payload.id, changes: payload };
  return {
    ...state,
    commentThreads: commentThreadAdapter.updateOne(update, state.commentThreads),
  };
};

const handleCommentThreadDelete = (
  state: ICommentsState,
  { payload }: actions.CommentThreadDelete
): ICommentsState => {
  return {
    ...state,
    commentThreads: commentThreadAdapter.removeOne(payload.id, state.commentThreads),
  };
};

// COMMENT REDUCERS
const handleCommentAdded = (
  state: ICommentsState,
  { payload }: actions.CommentCreateSuccess
): ICommentsState => {
  const { threadId } = payload;
  const commentMap = new Map(state.commentsMap);
  const comments = commentMap.get(threadId) || [];

  if (comments.indexOf(payload.id) === -1) {
    comments.push(payload.id);
  }

  commentMap.set(threadId, comments);

  return {
    ...state,
    comments: commentAdapter.addOne(payload, state.comments),
    commentsMap: commentMap,
  };
};

const handleCommentUpdate = (
  state: ICommentsState,
  { id, changes }: actions.CommentUpdate
): ICommentsState => {
  return {
    ...state,
    comments: commentAdapter.updateOne({ id, changes }, state.comments),
  };
};

// Is a copy of handleCommentUpdate
const handleCommentRemoteModified = (
  state: ICommentsState,
  { payload }: actions.CommentRemoteModified
): ICommentsState => {
  return {
    ...state,
    comments: commentAdapter.updateOne({ id: payload.id, changes: payload }, state.comments),
  };
};

const handleCommentDeleteSuccess = (
  state: ICommentsState,
  { payload }: actions.CommentDeleteSuccess
): ICommentsState => {
  const { id } = payload;
  const comment = state.comments.entities[id];

  if (!comment) return state;

  const { threadId } = comment;
  const commentMap = new Map(state.commentsMap);
  const comments = commentMap.get(threadId) || [];
  const index = comments.indexOf(id);
  comments.splice(index, 1);
  commentMap.set(threadId, comments);

  return {
    ...state,
    comments: commentAdapter.removeOne(id, state.comments),
    commentsMap: commentMap,
  };
};

const handleSetCommentCounts = (
  state: ICommentsState,
  { commentCounts }: actions.CommentSetCounts
): ICommentsState => ({
  ...state,
  commentCounts,
});

const lookup: IReducerFunctionLookup = {
  // COMMENT THREAD HANDLERS
  [actions.COMMENT_THREAD_CREATE_SUCCESS]: handleCommentThreadAdded,
  [actions.COMMENT_THREAD_REMOTE_ADDED]: handleCommentThreadAdded,
  [actions.COMMENT_THREAD_UPDATE]: handleCommentThreadUpdate,
  [actions.COMMENT_THREAD_REMOTE_MODIFIED]: handleCommentThreadRemoteModified, // Copy of handleCommentThreadUpdate
  [actions.COMMENT_THREAD_DELETE]: handleCommentThreadDelete,
  [actions.COMMENT_THREAD_REMOTE_REMOVED]: handleCommentThreadDelete,

  // COMMENT HANDLERS
  [actions.COMMENT_CREATE_SUCCESS]: handleCommentAdded,
  [actions.COMMENT_REMOTE_ADDED]: handleCommentAdded,
  [actions.COMMENT_UPDATE]: handleCommentUpdate,
  [actions.COMMENT_REMOTE_MODIFIED]: handleCommentRemoteModified, // Copy of handleCommentUpdate
  [actions.COMMENT_DELETE_SUCCESS]: handleCommentDeleteSuccess,
  [actions.COMMENT_REMOTE_REMOVED]: handleCommentDeleteSuccess,

  // Comment counts
  [actions.COMMENT_SET_COUNTS]: handleSetCommentCounts,
};

export function reducer(
  state: ICommentsState = initialState,
  action: actions.CommentThreadActions
) {
  return action.type in lookup ? lookup[action.type](state, action) : state;
}
