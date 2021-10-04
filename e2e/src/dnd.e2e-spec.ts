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
import { INTERACTION_INTERVAL } from './configs/timing.configs';
import { hexColorToRGB } from './utils/styles.utils';
import { setupSuite } from './utils/tests.utils';
import {
  selectAndViewBoard,
  toggleElementsSelection,
  clearSelection,
  clickElement,
  fitToBounds,
} from './ui-utils/components/canvas.utils';
import {
  dragElementFromComponentToBoard,
  changeNewElementsProps,
  addNewBoard,
  getElementStyles,
} from './ui-utils/design-surface.utils';
import { dragAndDropBySel } from './ui-utils/common/dnd.utils';
import * as contextMenu from './ui-utils/components/context-menu.utils';
import { IHexColor } from './models/props.interfaces';
import { elemPos } from './utils/elements';
import { glassElementSelector, glassBoardSelector } from './ui-utils/common/id.utils';

describe('Drag-n-drop', () => {
  let page: Page;

  const newTestPageCallback = (p: Page) => {
    page = p;
  };

  setupSuite(newTestPageCallback, beforeAll, afterAll, beforeEach, afterEach);

  it('should manipulate multiple elements across boards correctly', async () => {
    const BGCOLOR_00: IHexColor = { hex: '#ff0000' };
    const BGCOLOR_01: IHexColor = { hex: '#00ff00' };
    const BGCOLOR_10: IHexColor = { hex: '#0000ff' };
    const BGCOLOR_11: IHexColor = { hex: '#ffff00' };

    await addNewBoard(page);
    await addNewBoard(page);

    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);

    await selectAndViewBoard(page, 1);
    await dragElementFromComponentToBoard(page, 1);
    await dragElementFromComponentToBoard(page, 1);

    await selectAndViewBoard(page, 0);
    await changeNewElementsProps(page, { backgrounds: [BGCOLOR_00] }, elemPos(0, [0]));
    await changeNewElementsProps(page, { backgrounds: [BGCOLOR_01] }, elemPos(0, [1]));

    await selectAndViewBoard(page, 1);
    await changeNewElementsProps(page, { backgrounds: [BGCOLOR_10] }, elemPos(1, [0]));
    await changeNewElementsProps(page, { backgrounds: [BGCOLOR_11] }, elemPos(1, [1]));

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clearSelection(page);

    await toggleElementsSelection(page, [elemPos(0, [1]), elemPos(1, [0]), elemPos(1, [1])]);

    const dragSourceSelector = await glassElementSelector(page, 1, [1]);
    const dragTargetSelector = await glassBoardSelector(page, 2);
    await dragAndDropBySel(page, dragSourceSelector, dragTargetSelector);

    await selectAndViewBoard(page, 2);

    const destinationStyles = [
      await getElementStyles(page, elemPos(2, [0]), ['backgroundColor']),
      await getElementStyles(page, elemPos(2, [1]), ['backgroundColor']),
      await getElementStyles(page, elemPos(2, [2]), ['backgroundColor']),
    ];

    expect(destinationStyles).toEqual(
      [
        { backgroundColor: hexColorToRGB(BGCOLOR_01) },
        { backgroundColor: hexColorToRGB(BGCOLOR_10) },
        { backgroundColor: hexColorToRGB(BGCOLOR_11) },
      ],
      'mismatching styles for drag-n-dropped elements'
    );
  });

  it('b/123757246 - copied-pasted element should be dragged-and-dropped to another board correctly', async () => {
    const BGCOLOR: IHexColor = { hex: '#ff0000' };

    await addNewBoard(page);

    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);
    await changeNewElementsProps(page, { backgrounds: [BGCOLOR] }, elemPos(0, [0]));

    await clickElement(page, elemPos(0, [0]), false, true);
    await contextMenu.copy(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickElement(page, elemPos(0, [0]), false, true);
    await contextMenu.paste(page);

    await fitToBounds(page);

    const dragSourceSelector = await glassElementSelector(page, 0, [1]);
    const dragTargetSelector = await glassBoardSelector(page, 1);
    await dragAndDropBySel(page, dragSourceSelector, dragTargetSelector);

    await selectAndViewBoard(page, 1);

    const destinationStyle = await getElementStyles(page, elemPos(1, [0]), ['backgroundColor']);
    expect(destinationStyle).toEqual(
      { backgroundColor: hexColorToRGB(BGCOLOR) },
      'mismatching styles for pasted/drag-n-dropped element'
    );
  });
});
