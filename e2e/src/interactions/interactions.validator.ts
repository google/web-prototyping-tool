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
import { PREVIEW_IFRAME } from '../consts/query-selectors';
import { IElementValues, ITestExpectations } from '../consts/tests.interface';
import { INTERACTION_INTERVAL } from '../configs/timing.configs';
import { getElementPropertiesData } from '../utils/project.utils';
import * as preview from '../ui-utils/preview.utils';
import * as cd from 'cd-interfaces';

const verifyBoardName = async (boardName: string, page: Page) => {
  const currentBoardName = await preview.getCurrentBoardName(page);
  await expect(currentBoardName).toEqual(boardName, 'mismatching navigated-to board name');
};

const verifyExistsInQuery = async (queries: string[], page: Page, shouldExist: boolean) => {
  const frame = await previewFrame(page);
  if (!frame) return;
  for (const query of queries) {
    const element = await frame.$(query);
    if (shouldExist) {
      await expect(element).toBeDefined(true);
    } else {
      await expect(element).toBeNull(true);
    }
  }

  await page.waitForTimeout(INTERACTION_INTERVAL);
};

const verifyModalName = async (modalName: string, page: Page) => {
  const dataForModel = await findDataForBoardName(modalName, page);
  const selector = 'cd-outlet-modal div.inner-root';
  const frame = await previewFrame(page);
  if (!frame) return;
  const modalId = await frame.evaluate(
    (sel) => (document.querySelector(sel) as HTMLElement).dataset?.id,
    selector
  );

  await expect(modalId).toEqual(dataForModel.id);
};

/** Is there a portal (inner-root) that is pointed at a specific board */
const verifyPortal = async (portalName: string, page: Page) => {
  const dataForModel = await findDataForBoardName(portalName, page);
  await expect(dataForModel).toBeDefined(true);
  const selector = `div.inner-root[data-id="${dataForModel.id}"]`;
  const frame = await previewFrame(page);
  if (!frame) return;
  const portalPointer = await frame.evaluate(
    (sel) => (document.querySelector(sel) as HTMLElement) !== undefined,
    selector
  );
  await expect(portalPointer).toBeDefined(true);
};

const verifyElementValues = async (values: IElementValues[], page: Page) => {
  for (const value of values) {
    if (value.styles) {
      const styles = Object.keys(value.styles);
      const elemStyle = await preview.getElementStyles(page, value.elementIndices, styles);
      expect(elemStyle).toEqual(value.styles, 'mismatching element styles');
    }
    if (value.inputs) {
      throw new Error('Verifying inputs not implemented yet in E2E');
    }
  }
};

const verifySymbolChildValues = async (values: IElementValues[], page: Page) => {
  for (const value of values) {
    if (value.styles && value.symbolName) {
      const styles = Object.keys(value.styles);
      const elemStyles = await preview.getSymbolChildstyles(
        page,
        value.symbolName,
        value.elementIndices,
        styles
      );

      expect(elemStyles).toEqual(value.styles, 'mismatching element styles');
    }

    if (value.inputs) {
      throw new Error('Verifying inputs not implemented yet in E2E');
    }
  }
};

export const interactionsValidator = async (
  expected: ITestExpectations | undefined,
  page: Page
) => {
  if (!expected) return;

  await page.waitForTimeout(INTERACTION_INTERVAL * 2);

  if (expected.boardName) {
    await verifyBoardName(expected.boardName, page);
  }

  if (expected.boardShouldNotHaveElementsInQuery) {
    await verifyExistsInQuery(expected.boardShouldNotHaveElementsInQuery, page, false);
  }

  if (expected.boardHasElementsInQuery) {
    await verifyExistsInQuery(expected.boardHasElementsInQuery, page, true);
  }

  if (expected.modalName) {
    await verifyModalName(expected.modalName, page);
  }

  if (expected.portalPointedAtBoard) {
    await verifyPortal(expected.portalPointedAtBoard, page);
  }

  if (expected.elementValues) {
    await verifyElementValues(expected.elementValues, page);
  }

  if (expected.symbolElementValues) {
    await verifySymbolChildValues(expected.symbolElementValues, page);
  }
};

const findDataForBoardName = async (boardName: string, page: Page) => {
  const data = await getElementPropertiesData(page);
  return Object.values(data).find(
    (item) => (item as cd.IRootElementProperties).name === boardName
  ) as cd.IRootElementProperties;
};

const previewFrame = async (page: Page) => {
  const iframe = await page.waitForSelector(PREVIEW_IFRAME);
  return await iframe.contentFrame();
};
