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

import { Page, ElementHandle } from 'puppeteer';
import { Modifier } from '../../utils/cd-utils-keycodes.utils';
import { INTERACTION_INTERVAL } from '../../configs/timing.configs';
import { IElementPosition } from '../../models/elements.interface';
import { glassElementSelector, glassBoardSelector } from '../common/id.utils';
import { getTreeCellElementHandle } from './layers-panel.utils';
import * as activityBar from './activity-bar.utils';
import * as selectors from '../../consts/query-selectors/';
import * as shortcuts from '../../consts/shortcuts.consts';

export const selectBoardAndSnap = async (
  page: Page,
  index: number = 0,
  symbolIsolation = false
) => {
  await activityBar.showLayersPanel(page);

  const boardsSelector = symbolIsolation
    ? selectors.LAYERS_PANEL_SYMBOL_ISO_COMPONENT_ROOT
    : selectors.LAYERS_PANEL_BOARDS;
  const boards = await page.$$(boardsSelector);
  await boards[index].click();
  await page.waitForTimeout(INTERACTION_INTERVAL);

  await page.keyboard.press(shortcuts.SNAP_TO_BOARD);
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

/**
 * Change viewport position/zooming to show the entire board. This is implemented
 * cheaply by "Snap to board" --- but with the side effect that the board becomes
 * selected since we need to select that first (with layers panel).
 */
export const selectAndViewBoard = async (
  page: Page,
  index: number = 0,
  symbolIsolation = false
) => {
  await selectBoardAndSnap(page, index, symbolIsolation);
  await activityBar.hideLayersPanel(page);
};

export const fitToBounds = async (page: Page) => {
  await page.keyboard.press(shortcuts.FIT_TO_BOUNDS);
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

export const clickCanvas = async (page: Page, rightButton = false) => {
  const canvas = await page.waitForSelector(selectors.CANVAS);
  await canvas.click({ button: rightButton ? 'right' : 'left' });
};

export const clickBoard = async (page: Page, index: number, shift = false, rightButton = false) => {
  const boardSelector = await glassBoardSelector(page, index);
  const board = await page.waitForSelector(boardSelector);

  await clickElementByHandle(page, board, shift, rightButton);
};

export const clickBoardInIsolation = async (page: Page, shift = false, rightButton = false) => {
  const boardHeader = await page.waitForSelector(selectors.SYMBOL_ISOLATION_BOARD_HEADER);

  await clickElementByHandle(page, boardHeader, shift, rightButton);
};

export const clickSymbolChild = async (
  page: Page,
  elementIndices: number[] = [],
  shift = false,
  rightButton = false
) => {
  await activityBar.showLayersPanel(page);

  const childElement = await getTreeCellElementHandle(page, elementIndices[0]);
  if (!childElement) return;
  await clickElementByHandle(page, childElement, shift, rightButton);
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

const clickElementByHandle = async (
  page: Page,
  elem: ElementHandle<Element>,
  shift = false,
  rightButton = false
) => {
  if (shift) await page.keyboard.down(Modifier.Shift);
  await elem.click({ button: rightButton ? 'right' : 'left' });
  if (shift) await page.keyboard.up(Modifier.Shift);
};

export const clickElement = async (
  page: Page,
  { boardIndex, indices }: IElementPosition,
  shift = false,
  rightButton = false
) => {
  const selector = await glassElementSelector(page, boardIndex, indices);
  const elem = await page.waitForSelector(selector);

  await clickElementByHandle(page, elem, shift, rightButton);
};

export const toggleBoardsSelection = async (page: Page, boardIndexes: number[]) => {
  await fitToBounds(page);
  for (const index of boardIndexes) {
    await clickBoard(page, index, true);
  }
};

export const toggleElementsSelection = async (page: Page, positions: IElementPosition[]) => {
  await fitToBounds(page);
  for (const position of positions) {
    await clickElement(page, position, true);
  }
};

// This the most flaky part of the test utils, because intuitively
// we want to click canvas. However, it turns out to be hard to reliably
// tell which coordinates in the viewport should we click in order to click on
// canvas, instead of clicking on board/element, for any given moment.
// The workaround is to select only first board, and deselecting it by shift-select it.
export const clearSelection = async (page: Page) => {
  await selectAndViewBoard(page, 0);
  await clickBoard(page, 0, true);
};
