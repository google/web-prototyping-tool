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

import { ICommentsState } from '../store/reducers/comment-threads.reducer';
import * as cd from 'cd-interfaces';

export const calculateCommentCounts = (value: ICommentsState): Map<string, number> => {
  const entities = (Object.values(value.commentThreads.entities) ||
    []) as cd.ICommentThreadDocument[];
  return entities.reduce((mapping, entity) => {
    const { targetId } = entity;
    const currentCount = mapping.get(targetId) || 0;
    const threadLookup = value.commentsMap.get(entity.id);
    const entityCount = (threadLookup && entity.resolved === false && threadLookup.length) || 0;
    const total = currentCount + entityCount;
    mapping.set(targetId, total);
    return mapping;
  }, new Map<string, number>());
};

export const sortComments = (ids: Array<string>, commentsState: ICommentsState) => {
  const { comments } = commentsState;

  return ids.sort((a: any, b: any) => {
    const aObject = comments.entities[a];
    const bObject = comments.entities[b];
    if (!aObject || !bObject) return -1;

    return aObject.createdAt - bObject.createdAt;
  });
};
