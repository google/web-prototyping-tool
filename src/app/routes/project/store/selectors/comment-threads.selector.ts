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

import { getProjectState, IProjectState } from '../reducers';
import { createSelector } from '@ngrx/store';
import {
  commentThreadAdapter,
  ICommentsState,
  commentAdapter,
} from '../reducers/comment-threads.reducer';

export const getCommentsState = createSelector(
  getProjectState,
  (state: IProjectState) => state.commentsState
);

export const getCommentThreads = createSelector(
  getCommentsState,
  (state: ICommentsState) => state.commentThreads
);

export const getComments = createSelector(
  getCommentsState,
  (state: ICommentsState) => state.comments
);

export const getCommentsMap = createSelector(
  getCommentsState,
  (state: ICommentsState) => state.commentsMap
);

export const getCommentCounts = createSelector(
  getCommentsState,
  (state: ICommentsState) => state.commentCounts
);

export const {
  selectIds: selectCommentThreadIds,
  selectEntities: selectCommentThreadEntities,
  selectAll: selectAllCommentThreads,
  selectTotal: selectTotalCommentThreads,
} = commentThreadAdapter.getSelectors(getCommentThreads);

export const {
  selectIds: selectCommentIds,
  selectEntities: selectCommentEntities,
  selectAll: selectAllComments,
  selectTotal: selectTotalComments,
} = commentAdapter.getSelectors(getComments);
