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
import { clickElement } from '../ui-utils/components/canvas.utils';
import { elemPos } from '../utils/elements';
import { INTERACTION_INTERVAL } from '../configs/timing.configs';
import {
  PROPS_PANEL_SYMBOLS_COLOR,
  PROPS_GROUP,
  CANVAS_IFRAME,
  getRenderedElementSelector,
} from '../consts/query-selectors';
import { getElementId } from '../ui-utils/common/id.utils';
import { getElementStyles } from '../ui-utils/components/renderer.utils';
import * as project from '../utils/project.utils';
import * as utils from '../consts/tests.interface';
import * as surfaceUtils from '../ui-utils/design-surface.utils';
import * as cd from 'cd-interfaces';

export const symbolsValidator = async (
  expected: utils.ITestExpectations | undefined,
  page: Page
) => {
  if (!expected) return;

  await page.waitForTimeout(INTERACTION_INTERVAL);

  if (expected.stylesMatch) {
    await verifyStylesMatch(expected.stylesMatch, page);
  }

  if (expected.symbolStylesMatch) {
    await verifySymbolsStylesMatch(expected.symbolStylesMatch, page);
  }

  if (expected.propsPanelExists) {
    await verifyPropsPanelExists(expected.propsPanelExists, page);
  }

  if (expected.propsPanelGroupExists) {
    await verifyPropsPanelGroupCheck(expected.propsPanelGroupExists, page);
  }

  if (expected.propsPanelGroupDoesNotExist) {
    await verifyPropsPanelGroupCheck(expected.propsPanelGroupDoesNotExist, page, false);
  }

  if (expected.numberOfChildren) {
    await verifyNumberOfChildren(expected.numberOfChildren, page);
  }

  if (expected.boardSizeMatch) {
    await verifyBoardSizeMatch(expected.boardSizeMatch, page);
  }

  if (expected.symbolSizeMatch) {
    await verifySymbolSizeMatch(expected.symbolSizeMatch, page);
  }

  if (expected.symbolDefStylesMatch) {
    await verifySymbolDefStylesMatch(expected.symbolDefStylesMatch, page);
  }

  if (expected.checkPortalChildren) {
    await verifyCheckPortalChildren(expected.checkPortalChildren, page);
  }
};

const verifyStylesMatch = async (stylesMatch: utils.IExpectStylesMatch[], page: Page) => {
  for (const styleMatch of stylesMatch) {
    const { elementIndices, boardIndex, styles, failureMessage } = styleMatch;
    const stylesKeys = Object.keys(styles);
    const position = elemPos(boardIndex, elementIndices);
    const elementStyles = await surfaceUtils.getElementStyles(page, position, stylesKeys);

    await expect(elementStyles).toEqual(
      styles,
      failureMessage || 'mismatching default element styles'
    );
  }
};

const verifySymbolsStylesMatch = async (
  symbolStylesMatch: utils.IExpectSymbolStylesMatch[],
  page: Page
) => {
  const projectData = await project.getElementPropertiesData(page);
  const projectValues = Object.values(projectData);
  for (const styleMatch of symbolStylesMatch) {
    const { instanceIndex, childIndex, boardName, boardIndex, styles, failureMessage } = styleMatch;
    const stylesKeys = Object.keys(styles);

    if (childIndex !== undefined) {
      const boardData = projectValues.find((elemProp) => elemProp?.name === boardName);
      if (!boardData) return;

      const instanceId = boardData.childIds[instanceIndex];
      if (!instanceId) return;

      const { inputs } = (await project.getDataForId(
        instanceId,
        page
      )) as cd.ISymbolInstanceProperties;
      const { referenceId } = inputs;
      if (!referenceId) return;

      const symbolDefData = (await project.getDataForId(referenceId, page)) as cd.ISymbolProperties;
      const idOfChildToCheck = symbolDefData.childIds[childIndex];
      if (!idOfChildToCheck) return;

      const elementStyles = await surfaceUtils.getInstanceChildElementStyles(
        page,
        boardIndex,
        instanceId,
        idOfChildToCheck,
        stylesKeys
      );

      expect(elementStyles).toEqual(
        styles,
        failureMessage || 'mistmaching default symbol child styles'
      );
    } else {
      const position = { boardIndex, indices: [instanceIndex] };
      const elementStyles = await surfaceUtils.getElementStyles(page, position, stylesKeys);

      expect(elementStyles).toEqual(
        styles,
        failureMessage || 'mistmaching default symbol child styles'
      );
    }
  }
};

const verifyPropsPanelExists = async (expected: utils.IPropsPanelExists, page: Page) => {
  const { boardIndex, elementIndex } = expected;
  const position = elemPos(boardIndex, [elementIndex]);
  await clickElement(page, position);

  // we're not testing props changes, but at least make sure props panel at least loads
  const propsPanel = await page.waitForSelector(PROPS_PANEL_SYMBOLS_COLOR);
  expect(propsPanel).toBeTruthy();
};

const verifyPropsPanelGroupCheck = async (
  expected: utils.IPropsPanelGroupExists,
  page: Page,
  exists = true
) => {
  const { groupName, boardIndex, elementIndices } = expected;
  const position = elemPos(boardIndex, elementIndices);
  await clickElement(page, position);

  const selector = PROPS_GROUP(groupName);

  if (exists) {
    const group = await page.waitForSelector(selector);
    expect(group).toBeTruthy();
  } else {
    const group = await page.waitForSelector(selector, { hidden: true });
    expect(group).toBeFalsy();
  }
};

const verifyNumberOfChildren = async (expected: utils.INumberOfChildren, page: Page) => {
  const { boardName, elementIndex, numberChildren } = expected;
  const projectData = await project.getElementPropertiesData(page);
  const boardData = Object.values(projectData).find((elemProp) => elemProp?.name === boardName);
  if (!boardData) return;

  const instanceId = boardData.childIds[elementIndex];
  if (!instanceId) return;

  const { inputs } = (await project.getDataForId(instanceId, page)) as cd.ISymbolInstanceProperties;
  const { referenceId } = inputs;
  if (!referenceId) return;

  const symbolDefData = (await project.getDataForId(referenceId, page)) as cd.ISymbolProperties;

  expect(symbolDefData.childIds.length).toBe(numberChildren);
};

const verifyBoardSizeMatch = async (expected: utils.IBoardSizeMatch, page: Page) => {
  const { boardName, width, height } = expected;

  const board = await project.getDataForElementName(boardName, page, cd.ElementEntitySubType.Board);
  expect(board).toBeTruthy();

  if (!board) return;
  const { frame } = board;

  expect(frame.height).toBe(height);
  expect(frame.width).toBe(width);
};

const verifySymbolSizeMatch = async (expected: utils.ISymbolSizeMatch, page: Page) => {
  const { symbolName, width, height } = expected;

  const symbol = await project.getDataForElementName(
    symbolName,
    page,
    cd.ElementEntitySubType.Symbol
  );
  expect(symbol).toBeTruthy();

  if (!symbol) return;
  const { frame } = symbol;

  expect(frame.height).toBe(height);
  expect(frame.width).toBe(width);
};

const verifySymbolDefStylesMatch = async (
  expected: utils.IExpectSymbolDefStylesMatch[],
  page: Page
) => {
  for (const defStyleMatch of expected) {
    const { symbolName, styles, failureMessage, childIndex } = defStyleMatch;
    const stylesKeys = Object.keys(styles);

    const { childIds, styles: symbolDefRootStyles } = await project.getDataForElementName(
      symbolName,
      page
    );
    const childId = childIndex !== undefined ? childIds[childIndex] : undefined;
    const childElement =
      childId !== undefined ? await project.getDataForId(childId, page) : undefined;
    const symbolStyles = childElement ? childElement.styles : symbolDefRootStyles;

    const styleMap = symbolStyles.base.style;
    if (!styleMap) {
      return expect(styleMap).toBeTruthy();
    }

    const stylesToCheck = stylesKeys.reduce(
      (acc, curr) => ({
        ...acc,
        [curr]: styleMap[curr]?.value !== undefined ? styleMap[curr].value : styleMap[curr],
      }),
      {}
    );

    expect(stylesToCheck).toEqual(
      styles,
      failureMessage || 'Symbol definition styles do not match expected styles'
    );
  }
};

const verifyCheckPortalChildren = async (expected: utils.IPortalChildrenCheck, page: Page) => {
  const { boardIndex, elementIndices, childIndices, symbolIndices, styles } = expected;
  // get the board data
  const boardData = await project.getDataForBoardAtIndex(boardIndex, page);
  if (!boardData) {
    return expect(boardData).toBeTruthy(`Could not find board data for boardIndex ${boardIndex}`);
  }

  // get the portal, (keep reference to it)
  const portalId = await getElementId(page, boardData.id, elementIndices);
  if (!portalId) {
    return expect(portalId).toBeTruthy(`Could not find portal ID using indices ${elementIndices}`);
  }

  const portalData = await project.getDataForId(portalId, page);
  if (!portalData) {
    return expect(portalData).toBeTruthy(`Could not find portal data using ID ${portalId}`);
  }

  // get it's referenceId (board it's pointing to)
  const { referenceId } = (portalData as cd.IBoardPortalProperties).inputs;
  if (!referenceId) {
    return expect(referenceId).toBeTruthy('Portal referenceId could not be found');
  }

  // get that board data
  const referencedBoardData = await project.getDataForId(referenceId, page);
  if (!referencedBoardData) {
    return expect(referencedBoardData).toBeTruthy(
      `Could not find board data for boardIndex ${boardIndex}`
    );
  }

  // get relevant child (using the childIndices from expected)
  const childId = await getElementId(page, referencedBoardData.id, childIndices);
  if (!childId) {
    return expect(childId).toBeTruthy(`Could not find child id for childIndices ${childIndices}`);
  }

  const childData = await project.getDataForId(childId, page);
  if (!childData) {
    return expect(childData).toBeTruthy(`Could not find child data using ID ${childId}`);
  }

  const iframeSelector = CANVAS_IFRAME(boardData.id);
  const iframe = await page.waitForSelector(iframeSelector);
  const stylesKeys = Object.keys(styles);

  // if symbolIndicies, the children you're getting are symbols, and you need to go one further
  if (symbolIndices) {
    // child is a symbol, we must go deeper
    const { referenceId: symbolRefId } = (childData as cd.ISymbolInstanceProperties).inputs;
    if (!symbolRefId) {
      return expect(symbolRefId).toBeTruthy(
        `Could not find symbol ref ID using childData ${childData}`
      );
    }

    const symbolDef = await project.getDataForId(symbolRefId, page);
    if (!symbolDef) {
      return expect(symbolDef).toBeTruthy(`Could not find symbol ref data using ID ${symbolRefId}`);
    }

    const symbolChildId = await getElementId(page, symbolDef.id, symbolIndices);
    if (!symbolChildId) {
      return expect(symbolChildId).toBeTruthy(
        `Could not find symbol child ID using symbolIndices ${symbolIndices}`
      );
    }

    const elementSelector = getRenderedElementSelector(symbolChildId, '.cd-rendered-element');
    const childStyles = await getElementStyles(iframe, elementSelector, stylesKeys);

    expect(childStyles).toEqual(styles);
  } else {
    // found child. let's check styles
    const elementSelector = getRenderedElementSelector(childId, '.cd-rendered-element');
    const childStyles = await getElementStyles(iframe, elementSelector, stylesKeys);

    expect(childStyles).toEqual(styles);
  }
};
