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
import { POLLING } from '../../consts/puppeteer.consts';
import { getDataForElementName } from '../../utils/project.utils';
import * as selectors from '../../consts/query-selectors/';
import * as cd from 'cd-interfaces';

export const getBoardId = async (page: Page, boardIndex: number): Promise<string> => {
  const boardIdHandle = await page.waitForFunction(
    (ctxBoardIndex: number): string | undefined => {
      const app = (window as any).app;
      if (!app || !app.appState) return;
      const projectState = app.appState.project;
      if (!projectState) return;
      const boardId = projectState.projectData.project.boardIds[ctxBoardIndex];
      return boardId;
    },
    POLLING,
    boardIndex
  );
  const boardIdValue = (await boardIdHandle.jsonValue()) as string;
  return boardIdValue;
};

export const getElementId = async (
  page: Page,
  boardIndexOrId: number | string,
  indices: number[]
): Promise<string> => {
  const elementIdHandle = await page.waitForFunction(
    (ctxBoardIndexOrId: number | string, ctxIndices: number[]): string | undefined => {
      const app = (window as any).app;
      if (!app || !app.appState) return;
      const projectState = app.appState.project;
      if (!projectState) return;
      const boardId =
        typeof ctxBoardIndexOrId === 'string'
          ? ctxBoardIndexOrId
          : projectState.projectData.project.boardIds[ctxBoardIndexOrId];
      if (!boardId) return;
      let parent = projectState.elementProperties.elementProperties[boardId];
      let elementId = '';
      for (const index of ctxIndices) {
        if (!parent) return;
        elementId = parent.childIds[index];
        parent = projectState.elementProperties.elementProperties[elementId];
      }
      return elementId;
    },
    POLLING,
    boardIndexOrId,
    indices
  );
  const elementIdValue = (await elementIdHandle.jsonValue()) as string;
  return elementIdValue;
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
