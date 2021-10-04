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
import { INTERACTION_INTERVAL, PREVIEW_LAUNCH_DELAY } from './configs/timing.configs';
import { IElementPosition } from './models/elements.interface';
import { hexColorToRGB } from './utils/styles.utils';
import { setupSuite } from './utils/tests.utils';
import { selectAndViewBoard } from './ui-utils/components/canvas.utils';
import {
  addNewBoard,
  dragElementFromComponentToBoard,
  changeNewElementsProps,
  changeElementNavigateToBoard,
  launchPreview,
} from './ui-utils/design-surface.utils';
import * as preview from './ui-utils/preview.utils';
import * as routes from './ui-utils/routes.utils';
import { elemPos } from './utils/elements';

describe('Preview', () => {
  let page: Page;

  const newTestPageCallback = (p: Page) => {
    page = p;
  };

  setupSuite(newTestPageCallback, beforeAll, afterAll, beforeEach, afterEach);

  // TODO: These following two functions are really just written to reduce code duplication,
  //                and need quite some love to become a reusable util.
  const produceElement = async (
    position: IElementPosition,
    navTargetBoardName: string,
    colors: any
  ) => {
    const { boardIndex, indices } = position;
    const [index] = indices;

    await selectAndViewBoard(page, boardIndex);
    await dragElementFromComponentToBoard(page, boardIndex);
    await changeNewElementsProps(page, { backgrounds: [colors[boardIndex][index]] }, position);

    await changeElementNavigateToBoard(page, position, navTargetBoardName);
  };

  const expectResult = async (
    expectedBoardName: string,
    colors: any,
    boardIndex: number,
    index: number
  ) => {
    const currentBoardName = await preview.getCurrentBoardName(page);
    expect(currentBoardName).toEqual(expectedBoardName, 'mismatching navigated-to board name');

    const elemStyle = await preview.getElementStyles(page, [index], ['backgroundColor']);
    expect(elemStyle).toEqual(
      {
        backgroundColor: hexColorToRGB(colors[boardIndex][index]),
      },
      'mismatching element styles in navigated-to board'
    );
  };

  it('should click through boards', async () => {
    const ELEM_BGCOLORS = {
      0: {
        '0': { hex: '#ff8888' },
        '1': { hex: '#8888ff' },
      },
      1: {
        '0': { hex: '#ff0000' },
      },
      2: {
        '0': { hex: '#00ff00' },
      },
      3: {
        '0': { hex: '#0000ff' },
      },
    };

    await addNewBoard(page);
    await addNewBoard(page);
    await addNewBoard(page);

    // Board's first element links to Board 2
    await produceElement(elemPos(0, [0]), 'Board 2', ELEM_BGCOLORS);
    // Board's second element links to Board 4
    await produceElement(elemPos(0, [1]), 'Board 4', ELEM_BGCOLORS);
    // Board 2's first element links to Board 3
    await produceElement(elemPos(1, [0]), 'Board 3', ELEM_BGCOLORS);
    // Board 3's first element links to Board
    await produceElement(elemPos(2, [0]), 'Board', ELEM_BGCOLORS);
    // Board 4's first element links to Board
    await produceElement(elemPos(3, [0]), 'Board', ELEM_BGCOLORS);

    await launchPreview(page, 0);

    await routes.waitForPreview(page);
    await preview.waitForIFrame(page);

    // // TODO: Look into this more:
    // //                We're wait for styles to be applied so we need a signal/trigger.
    await page.waitForTimeout(PREVIEW_LAUNCH_DELAY);

    await expectResult('Board', ELEM_BGCOLORS, 0, 0);

    await preview.clickElement(page, [0]);
    await page.waitForTimeout(INTERACTION_INTERVAL);
    await expectResult('Board 2', ELEM_BGCOLORS, 1, 0);

    await preview.clickElement(page, [0]);
    await page.waitForTimeout(INTERACTION_INTERVAL);
    await expectResult('Board 3', ELEM_BGCOLORS, 2, 0);

    await preview.clickElement(page, [0]);
    await page.waitForTimeout(INTERACTION_INTERVAL);
    await expectResult('Board', ELEM_BGCOLORS, 0, 0);

    await preview.clickElement(page, [1]);
    await page.waitForTimeout(INTERACTION_INTERVAL);
    await expectResult('Board 4', ELEM_BGCOLORS, 3, 0);

    await preview.clickElement(page, [0]);
    await page.waitForTimeout(INTERACTION_INTERVAL);
    await expectResult('Board', ELEM_BGCOLORS, 0, 1);
  }, 200000); // this is a particularly long test, so ask jasmine to wait longer before async resolves
});
