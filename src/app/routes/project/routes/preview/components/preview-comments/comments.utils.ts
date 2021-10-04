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

import { ICommentsState } from 'src/app/routes/project/store/reducers/comment-threads.reducer';
import { EDIT_CONTENT_ATTR, NAME_ATTR, ZERO_WIDTH_SPACE } from 'cd-common/consts';
import { constructElement } from 'cd-common/utils';
import { CHIP_ELEMENT_NAME, CHIP_CLASSNAME, CHIP_DATA_ID_BINDING } from './comments.consts';
import { Dictionary } from '@ngrx/entity';
import * as cd from 'cd-interfaces';

type CommentMap = cd.IStringMap<cd.IComment[]>;

export const getTaggedItems = (
  textFieldParts: cd.ITaggableTextFieldNode[]
): cd.IStringMap<cd.IUser> => {
  return textFieldParts.reduce<cd.IStringMap<cd.IUser>>((acc, item) => {
    const { type, content } = item;
    if (content && type === cd.TextFieldElementType.Chip) {
      const user = content as cd.IUser;
      if (user.email) {
        acc[user.email] = user;
      }
    }
    return acc;
  }, {});
};

export const commentBodyToHtml = (commentBody: cd.ITaggableTextFieldNode[]): string => {
  return commentBody.reduce((htmlString, part) => htmlString + nodeFromType(part), '');
};

export const commentThreadsPerBoard = (
  boardId: string,
  entities: Dictionary<cd.ICommentThreadDocument>
): cd.ICommentThreadDocument[] => {
  return Object.values(entities).filter((value) => {
    return (value as cd.ICommentThreadDocument).targetId === boardId;
  }) as cd.ICommentThreadDocument[];
};

export const filterCommentThreadsByBoardId = (
  boardId: string,
  commentsState: ICommentsState
): cd.ICommentThread[] => {
  const { entities } = commentsState.commentThreads;
  const commentThreadDocuments = commentThreadsPerBoard(boardId, entities);
  const commentDocuments = Object.values(commentsState.comments.entities) as cd.ICommentDocument[];
  const commentsMap = getCommentsMap(commentDocuments);
  const commentThreads = mergeCommentThreadsAndCommentsMap(commentThreadDocuments, commentsMap);

  return commentThreads.sort((a, b) =>
    a.comments.length && b.comments.length ? b.comments[0].createdAt - a.comments[0].createdAt : 0
  );
};

export const getNumberOfResolvedThreads = (threads: cd.ICommentThread[]): number => {
  let count = 0;

  threads.map((item) => {
    if (item.resolved) count++;
  });

  return count;
};

const getCommentsMap = (commentDocuments: cd.ICommentDocument[]): cd.IStringMap<cd.IComment[]> => {
  return commentDocuments.reduce<CommentMap>((commentsMap, doc) => {
    const { threadId, owner } = doc;
    if (!commentsMap[threadId]) commentsMap[threadId] = [];
    const comment: cd.IComment = { ...doc, user: owner };
    commentsMap[threadId].push(comment);
    return commentsMap;
  }, {});
};

const getCommentThread = (
  commentThreadDocument: cd.ICommentThreadDocument,
  commentsMap: CommentMap
) => {
  const { id } = commentThreadDocument;
  const comments: cd.IComment[] = commentsMap[id] || [];
  comments.sort((a, b) => a.createdAt - b.createdAt);
  return { ...commentThreadDocument, comments };
};

const mergeCommentThreadsAndCommentsMap = (
  commentThreadDocuments: cd.ICommentThreadDocument[],
  commentsMap: CommentMap
): cd.ICommentThread[] => {
  return commentThreadDocuments.reduce<cd.ICommentThread[]>((threads, threadDoc) => {
    const commentThread = getCommentThread(threadDoc, commentsMap);
    threads.push(commentThread);
    return threads;
  }, []);
};

export const buildCommentChip = (name: string, email: string) => {
  return constructElement(CHIP_ELEMENT_NAME, CHIP_CLASSNAME, '', [
    [EDIT_CONTENT_ATTR, String(false)],
    [CHIP_DATA_ID_BINDING, email],
    [NAME_ATTR, name],
  ]);
};

const buildChipNode = (content: cd.IUser) => {
  const { email, name } = content as cd.IUser;
  if (!email || !name) return;
  const chip = buildCommentChip(name, email);
  return chip + ZERO_WIDTH_SPACE;
};

const nodeFromType = (part: cd.ITaggableTextFieldNode) => {
  const { type, content } = part;
  if (type === cd.TextFieldElementType.Break) return '<br/>';
  if (type === cd.TextFieldElementType.Chip) return buildChipNode(<cd.IUser>content);
  if (type === cd.TextFieldElementType.Link) return String(content);
  if (type === cd.TextFieldElementType.Text) return String(content);
  return;
};
