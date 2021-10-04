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

import { EntityState } from '@ngrx/entity';
import { BUBBLE_SIZE, RECT_PADDING } from './preview-canvas.interface';
import { generateFrame } from 'cd-common/utils';
import * as cd from 'cd-interfaces';
import { half } from 'cd-utils/numeric';

const getRectArea = (rect: cd.IRect) => rect.width * rect.height;
const HALF_BUBBLE = half(BUBBLE_SIZE);

export const getPaddedFrame = (frame: cd.IRect | undefined): cd.IRect | undefined => {
  if (!frame) return;
  const { x, y, width, height } = frame;
  const paddedX = x - HALF_BUBBLE;
  const paddedY = y - HALF_BUBBLE;
  return generateFrame(paddedX, paddedY, width, height);
};

// REMINDER: Boards do not report their render rects; their dimensions are based on what we set.
// Because of this, we need to pass in boardRenderResult manually.
export const getCurrentRenderRects = (
  boardId: string,
  renderRects: Map<string, cd.IRenderResult>
): [Map<string, cd.IRenderResult>, string[]] => {
  const relevantRenderRects = new Map<string, cd.IRenderResult>();
  const elementIds = [boardId];
  const boardRenderResult = renderRects.get(boardId);
  if (boardRenderResult) {
    relevantRenderRects.set(boardId, boardRenderResult);
  }

  for (const [id, renderResult] of renderRects.entries()) {
    if (renderResult.rootId !== boardId) continue;
    if (!boardRenderResult) continue;
    if (id === boardId) continue;
    relevantRenderRects.set(id, renderResult);
    elementIds.push(id);
  }
  const paddedRects = addRectPadding(relevantRenderRects);
  return [paddedRects, elementIds];
};

export const applyPaddingAndOffset = (frame: cd.IRect): cd.IRect => {
  const { x, y, width, height } = frame;
  const frameX = x - RECT_PADDING;
  const frameY = y - RECT_PADDING;
  const frameWidth = width + RECT_PADDING * 2;
  const frameHeight = height + RECT_PADDING * 2;
  return generateFrame(frameX, frameY, frameWidth, frameHeight);
};

export const addRectPadding = (
  rects: Map<string, cd.IRenderResult>
): Map<string, cd.IRenderResult> => {
  const paddedRectsMap = new Map<string, cd.IRenderResult>();
  for (const [key, value] of rects.entries()) {
    const frame = applyPaddingAndOffset(value.frame);
    const newRenderResult = { ...value, frame };
    paddedRectsMap.set(key, newRenderResult);
  }
  return paddedRectsMap;
};

export const sortRectsBySize = (
  highlightedElements: cd.ICommentThreadDocument[],
  rects: Map<string, cd.IRenderResult>
): cd.ICommentThreadDocument[] => {
  return highlightedElements.sort(({ elementTargetId: elemAId }, { elementTargetId: elemBId }) => {
    if (!elemAId || !elemBId) return 0;
    const { frame: aFrame } = rects.get(elemAId) as cd.IRenderResult;
    const aRectArea = getRectArea(aFrame);
    const { frame: bFrame } = rects.get(elemBId) as cd.IRenderResult;
    const bRectArea = getRectArea(bFrame);
    const sizeDifference = bRectArea - aRectArea;
    return sizeDifference;
  });
};

const sortThreadsByTime = (
  threads: cd.ICommentThreadDocument[],
  commentsMap: Map<string, string[]>,
  comments: EntityState<cd.ICommentDocument>
): cd.ICommentThreadDocument[] => {
  return [...threads].sort((threadA, threadB) => {
    const threadACommentIds = commentsMap.get(threadA.id);
    const threadBCommentIds = commentsMap.get(threadB.id);
    if (!threadACommentIds || !threadBCommentIds) return -1;

    const threadAComments = threadACommentIds.map((commentId) => comments.entities[commentId]);
    const threadBComments = threadBCommentIds.map((commentId) => comments.entities[commentId]);
    if (!threadAComments.length || !threadBComments.length) return -1;

    const { createdAt: createdA } = threadAComments[0] as cd.ICommentDocument;
    const { createdAt: createdB } = threadBComments[0] as cd.ICommentDocument;

    return createdA - createdB;
  });
};

export const getCommentedRects = (
  allHighlightedThreads: cd.ICommentThreadDocument[],
  currentRenderRects: Map<string, cd.IRenderResult>,
  hoveredThreadId: string | undefined
): cd.ICommentThreadDocument[] => {
  const highlightedElements = allHighlightedThreads.filter((thread) =>
    hoveredThreadId ? thread.id === hoveredThreadId : !thread.resolved
  );
  return sortRectsBySize(highlightedElements, currentRenderRects);
};

export const getCommentRectLabels = (
  allHighlightedThreads: cd.ICommentThreadDocument[],
  commentsMap: Map<string, string[]>,
  comments: EntityState<cd.ICommentDocument>
): Map<string, number> => {
  const sortedThreads = sortThreadsByTime(allHighlightedThreads, commentsMap, comments);
  let label = 1;
  return sortedThreads.reduce((acc, curr) => {
    const { id, elementTargetId } = curr;
    if (!elementTargetId) return acc;
    return acc.set(id, label++);
  }, new Map());
};
