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
import * as selectors from '../consts/query-selectors/';
import { ICSSValues } from '../models/props.interfaces';
import * as renderer from './components/renderer.utils';
import { rendererElementSelector, rendererSymbolChildSelector } from './common/id.utils';

export const waitForIFrame = async (page: Page) => {
  return await page.waitForSelector(selectors.PREVIEW_IFRAME);
};

export const getCurrentBoardName = async (page: Page) => {
  const boardNameElem = await page.waitForSelector(
    selectors.PREVIEW_OUTLETLIST_ACTIVE_OUTLET_LABEL
  );
  const name = await page.evaluate((docElem: HTMLElement) => docElem.textContent, boardNameElem);

  return name;
};

export const getCurrentBoardId = async (page: Page) => {
  const outlet = await page.waitForSelector(`${selectors.PREVIEW} ${selectors.OUTLET_FRAME}`);
  const boardId = await page.evaluate(
    (ctxOutlet) => ctxOutlet.getAttribute('ng-reflect-id'),
    outlet
  );
  return boardId;
};

export const getElementStyles = async (
  page: Page,
  indices: number[],
  props: string[]
): Promise<ICSSValues> => {
  const currentBoardId = await getCurrentBoardId(page);
  const elemSelector = await rendererElementSelector(page, currentBoardId, indices);
  const iframe = await page.waitForSelector(selectors.PREVIEW_IFRAME);
  return await renderer.getElementStyles(iframe, elemSelector, props);
};

export const getSymbolChildstyles = async (
  page: Page,
  symbolName: string,
  indices: number[],
  props: string[]
) => {
  const symbolChildSelector = await rendererSymbolChildSelector(page, symbolName, indices);
  if (!symbolChildSelector) return;
  const iframe = await page.waitForSelector(selectors.PREVIEW_IFRAME);
  return await renderer.getElementStyles(iframe, symbolChildSelector, props);
};

export const clickElement = async (page: Page, indices: number[]) => {
  const currentBoardId = await getCurrentBoardId(page);
  const elemSelector = await rendererElementSelector(page, currentBoardId, indices);
  const iframe = await page.waitForSelector(selectors.PREVIEW_IFRAME);
  await renderer.clickElement(iframe, elemSelector);
};

export const clickSymbolChild = async (page: Page, symbolName: string, indices: number[]) => {
  const symbolChildSelector = await rendererSymbolChildSelector(page, symbolName, indices);
  if (!symbolChildSelector) return;
  const iframe = await page.waitForSelector(selectors.PREVIEW_IFRAME);
  await renderer.clickElement(iframe, symbolChildSelector);
};
