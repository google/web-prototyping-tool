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

import { Page } from 'puppeteer';
import { getBoardIds, getDataForElementName, getProjectContent } from '../../utils/project.utils';
import * as selectors from '../../consts/query-selectors/';
import * as cd from 'cd-interfaces';

// TODO: boardIndex is not a reliable way of finding a board id, since we no longer store
// and array of boardIds
export const getBoardId = async (page: Page, boardIndex: number): Promise<string> => {
  const projectContent = await getProjectContent(page);
  const boardIds = getBoardIds(projectContent);
  if (!boardIds.length) return '';
  const boardId = boardIds[boardIndex];
  return boardId || '';
};

export const getElementId = async (
  page: Page,
  boardIndexOrId: number | string,
  indices: number[]
): Promise<string> => {
  const projectContent = await getProjectContent(page);
  if (!projectContent) return '';
  const boardIds = getBoardIds(projectContent);
  const elementProperties = projectContent.elementContent.records;

  const boardId = typeof boardIndexOrId === 'string' ? boardIndexOrId : boardIds[boardIndexOrId];
  if (!boardId) return '';
  let parent = elementProperties[boardId];
  let elementId = '';
  for (const index of indices) {
    if (!parent) return '';
    elementId = parent.childIds[index];
    parent = elementProperties[elementId];
  }
  return elementId;
};

export const glassBoardSelector = async (page: Page, boardIndex: number): Promise<string> => {
  const id = await getBoardId(page, boardIndex);
  return selectors.GLASS_OUTLET_FRAME(id);
};

export const canvasIframeSelector = async (page: Page, boardIndex: number): Promise<string> => {
  const id = await getBoardId(page, boardIndex);
  return selectors.CANVAS_IFRAME(id);
};

export const glassElementSelector = async (
  page: Page,
  boardIndex: number,
  elemIndices: number[]
): Promise<string> => {
  const id = await getElementId(page, boardIndex, elemIndices);
  return selectors.GLASS_ELEMENT(id);
};

export const glassElementSelectorById = async (
  page: Page,
  boardId: string,
  elemIndices: number[]
): Promise<string> => {
  const id = await getElementId(page, boardId, elemIndices);
  return selectors.GLASS_ELEMENT(id);
};

export const rendererElementSelector = async (
  page: Page,
  boardIndexOrId: number | string,
  elemIndices: number[]
): Promise<string> => {
  const id = await getElementId(page, boardIndexOrId, elemIndices);
  return selectors.getRenderedElementSelector(id);
};

export const rendererSymbolChildSelector = async (
  page: Page,
  symbolName: string,
  indices: number[]
): Promise<string | undefined> => {
  const symbolProperties = await getDataForElementName(
    symbolName,
    page,
    cd.ElementEntitySubType.Symbol
  );

  if (!symbolProperties || indices.length === 0) return;

  const symbolChildId = await getElementId(page, symbolProperties.id, indices);
  return selectors.getRenderedElementSelector(symbolChildId, '.cd-rendered-element');
};
