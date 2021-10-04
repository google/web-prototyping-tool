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

/* eslint-disable max-lines */

import { Page } from 'puppeteer';
import { setupSuite } from './utils/tests.utils';
import { DEFAULT_PRIMITIVE_STYLES, DEFAULT_PRIMITIVE_STYLE_PROPS } from './consts/styles.consts';
import {
  selectAndViewBoard,
  clickElement,
  clickBoard,
  clearSelection,
  toggleElementsSelection,
  toggleBoardsSelection,
  clickCanvas,
} from './ui-utils/components/canvas.utils';
import {
  dragElementFromComponentToBoard,
  getElementStyles,
  waitForGlassElemToDisappear,
  waitForRendererElemToDisappear,
  waitForGlassElement,
  addNewBoard,
  waitForIFrameToDisappear,
  waitForGlassBoardToDisappear,
  changeNewElementsProps,
} from './ui-utils/design-surface.utils';
import * as contextMenu from './ui-utils/components/context-menu.utils';
import { elemPos } from './utils/elements';
import { KEYS } from './utils/cd-utils-keycodes.utils';
import { IHexColor, ICSSValues } from './models/props.interfaces';
import { INTERACTION_INTERVAL } from './configs/timing.configs';
import { dragAndDropBySel } from './ui-utils/common/dnd.utils';
import { hexColorToRGB, cssNth } from './utils/styles.utils';
import {
  getElementId,
  getBoardId,
  glassElementSelector,
  glassBoardSelector,
} from './ui-utils/common/id.utils';
import { showThemePanel } from './ui-utils/components/activity-bar.utils';
import * as themePanel from './ui-utils/components/theme-panel.utils';
import * as selectors from './consts/query-selectors/';

describe('History (undo-redo)', () => {
  let page: Page;

  const newTestPageCallback = (p: Page) => {
    page = p;
  };

  setupSuite(newTestPageCallback, beforeAll, afterAll, beforeEach, afterEach);

  it('should undo/redo in-board copy-paste correctly', async () => {
    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickElement(page, elemPos(0, [0]), false, true);
    await contextMenu.copy(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickElement(page, elemPos(0, [0]), false, true);
    await contextMenu.paste(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    const pastedElementId = await getElementId(page, 0, [1]);

    // Undo paste, so the new elem has to disappear
    await clickElement(page, elemPos(0, [1]), false, true);
    await contextMenu.undo(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    const rendererElemDisappeared = await waitForRendererElemToDisappear(page, 0, pastedElementId);
    const glassElemDisappeared = await waitForGlassElemToDisappear(page, pastedElementId);

    expect(rendererElemDisappeared).toBeTruthy('un-pasted element did not disappear from renderer');
    expect(glassElemDisappeared).toBeTruthy('un-pasted element did not disappear from glass');

    // Redo paste, so the new elem has to reappear.
    await clickBoard(page, 0, false, true);
    await contextMenu.redo(page);

    await waitForGlassElement(page, elemPos(0, [1]));

    const renderedStyles = await getElementStyles(
      page,
      elemPos(0, [1]),
      DEFAULT_PRIMITIVE_STYLE_PROPS
    );

    expect(renderedStyles).toEqual(
      DEFAULT_PRIMITIVE_STYLES,
      'mismatching default styles for re-pasted element'
    );
  });

  it('should undo/redo element deletion correctly', async () => {
    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);

    await clearSelection(page);

    const elementId0 = await getElementId(page, 0, [0]);
    const elementId1 = await getElementId(page, 0, [1]);

    await toggleElementsSelection(page, [elemPos(0, [0]), elemPos(0, [1])]);
    await page.keyboard.press(KEYS.Delete);

    await waitForRendererElemToDisappear(page, 0, elementId0);
    await waitForGlassElemToDisappear(page, elementId0);
    await waitForRendererElemToDisappear(page, 0, elementId1);
    await waitForGlassElemToDisappear(page, elementId1);

    // undo the delete
    await clickBoard(page, 0, false, true);
    await contextMenu.undo(page);

    await waitForGlassElement(page, elemPos(0, [0]));
    await waitForGlassElement(page, elemPos(0, [1]));

    const renderedStyles0 = await getElementStyles(
      page,
      elemPos(0, [0]),
      DEFAULT_PRIMITIVE_STYLE_PROPS
    );

    expect(renderedStyles0).toEqual(
      DEFAULT_PRIMITIVE_STYLES,
      'mismatching default styles for un-deleted element at hLoc 0'
    );

    const renderedStyles1 = await getElementStyles(
      page,
      elemPos(0, [1]),
      DEFAULT_PRIMITIVE_STYLE_PROPS
    );

    expect(renderedStyles1).toEqual(
      DEFAULT_PRIMITIVE_STYLES,
      'mismatching default styles for un-deleted element at hLoc 1'
    );

    // redo the delete
    await clickBoard(page, 0, false, true);
    await contextMenu.redo(page);

    const rendererElem0Disappeared = await waitForRendererElemToDisappear(page, 0, elementId0);
    const glassElem0Disappeared = await waitForGlassElemToDisappear(page, elementId0);
    const rendererElem1Disappeared = await waitForRendererElemToDisappear(page, 0, elementId1);
    const glassElem1Disappeared = await waitForGlassElemToDisappear(page, elementId1);

    expect(rendererElem0Disappeared).toBeTruthy(
      're-deleted element at position 0 did not disappear from renderer'
    );
    expect(glassElem0Disappeared).toBeTruthy(
      're-deleted element at position 0 did not disappear from glass'
    );
    expect(rendererElem1Disappeared).toBeTruthy(
      're-deleted element at position 1 did not disappear from renderer'
    );
    expect(glassElem1Disappeared).toBeTruthy(
      're-deleted element at position 1 did not disappear from glass'
    );
  });

  it('b/137911132 - should undo/redo board copy-paste correctly', async () => {
    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickBoard(page, 0, false, true);
    await contextMenu.copy(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickCanvas(page, true);
    await contextMenu.paste(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickCanvas(page, true);
    await contextMenu.paste(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    const pastedBoardId1 = await getBoardId(page, 1);
    const pastedBoardId2 = await getBoardId(page, 2);

    // Undo paste twice, so all the pasted board should disappear
    await clickCanvas(page, true);
    await contextMenu.undo(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickCanvas(page, true);
    await contextMenu.undo(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    const iframeBoard1Disappeared = await waitForIFrameToDisappear(page, pastedBoardId1);
    const glassBoard1Disappeared = await waitForGlassBoardToDisappear(page, pastedBoardId1);

    expect(iframeBoard1Disappeared).toBeTruthy('un-pasted board 1 did not disappear from renderer');
    expect(glassBoard1Disappeared).toBeTruthy('un-pasted board 1 did not disappear from glass');

    const iframeBoard2Disappeared = await waitForIFrameToDisappear(page, pastedBoardId2);
    const glassBoard2Disappeared = await waitForGlassBoardToDisappear(page, pastedBoardId2);

    expect(iframeBoard2Disappeared).toBeTruthy('un-pasted board 2 did not disappear from renderer');
    expect(glassBoard2Disappeared).toBeTruthy('un-pasted board 2 did not disappear from glass');

    // Redo paste twice, so the pasted boards have to reappear.
    await clickCanvas(page, true);
    await contextMenu.redo(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickCanvas(page, true);
    await contextMenu.redo(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await waitForGlassElement(page, elemPos(1, [0]));
    await waitForGlassElement(page, elemPos(2, [0]));

    const renderedStyles1 = await getElementStyles(
      page,
      elemPos(1, [0]),
      DEFAULT_PRIMITIVE_STYLE_PROPS
    );

    expect(renderedStyles1).toEqual(
      DEFAULT_PRIMITIVE_STYLES,
      'mismatching default styles for pasted element at loc 1-0'
    );

    const renderedStyles2 = await getElementStyles(
      page,
      elemPos(2, [0]),
      DEFAULT_PRIMITIVE_STYLE_PROPS
    );

    expect(renderedStyles2).toEqual(
      DEFAULT_PRIMITIVE_STYLES,
      'mismatching default styles for pasted element at loc 2-0'
    );
  });

  it('should undo/redo board deletion correctly', async () => {
    await addNewBoard(page);
    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);

    await selectAndViewBoard(page, 1);
    await dragElementFromComponentToBoard(page, 1);

    const boardId0 = await getBoardId(page, 0);
    const boardId1 = await getBoardId(page, 1);

    await clearSelection(page);
    await toggleBoardsSelection(page, [0, 1]);
    await page.keyboard.press(KEYS.Delete);

    await waitForIFrameToDisappear(page, boardId0);
    await waitForGlassBoardToDisappear(page, boardId1);
    await waitForIFrameToDisappear(page, boardId0);
    await waitForGlassBoardToDisappear(page, boardId1);

    // undo the delete
    await clickCanvas(page, true);
    await contextMenu.undo(page);

    // XXX (): Weird we need this, but waitForGlassElem fails
    // if we don't trigger a selection change
    await clearSelection(page);

    await waitForGlassElement(page, elemPos(0, [0]));
    await waitForGlassElement(page, elemPos(1, [0]));

    await page.waitForTimeout(INTERACTION_INTERVAL);

    const renderedStyles = await getElementStyles(
      page,
      elemPos(0, [0]),
      DEFAULT_PRIMITIVE_STYLE_PROPS
    );

    expect(renderedStyles).toEqual(
      DEFAULT_PRIMITIVE_STYLES,
      'mismatching default styles for element in un-deleted board'
    );

    // redo the delete
    await clickCanvas(page, true);
    await contextMenu.redo(page);

    const iframe0Disappeared = await waitForIFrameToDisappear(page, boardId0);
    const glass0Disappeared = await waitForGlassBoardToDisappear(page, boardId0);
    const iframe1Disappeared = await waitForIFrameToDisappear(page, boardId1);
    const glass1Disappeared = await waitForGlassBoardToDisappear(page, boardId1);

    expect(iframe0Disappeared).toBeTruthy('re-deleted board 0 still has iframe');
    expect(glass0Disappeared).toBeTruthy('re-deleted board 0 did not disappear from glass');
    expect(iframe1Disappeared).toBeTruthy('re-deleted board 1 still has iframe');
    expect(glass1Disappeared).toBeTruthy('re-deleted board 1 did not disappear from glass');
  });

  it('should undo/redo complex steps: properties & drag-n-drop', async () => {
    const WIDTH_00 = 500;
    const BGCOLOR_00: IHexColor = { hex: '#ff0000', opacityPercentage: 20 };

    await addNewBoard(page);
    await addNewBoard(page);

    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);

    await selectAndViewBoard(page, 1);
    await dragElementFromComponentToBoard(page, 1);

    await selectAndViewBoard(page, 0);
    // Note: this gives three undoable steps
    //       (width, color, alpha).
    //       - How things are undone in order is dependent upon changeNewElementsProps() implementation.
    const props = {
      width: WIDTH_00,
      backgrounds: [BGCOLOR_00],
    };
    await changeNewElementsProps(page, props, elemPos(0, [0]));

    await clearSelection(page);

    await toggleElementsSelection(page, [elemPos(0, [0]), elemPos(1, [0])]);

    const dragSourceSelector = await glassElementSelector(page, 0, [0]);
    const dragTargetSelector = await glassBoardSelector(page, 2);
    await dragAndDropBySel(page, dragSourceSelector, dragTargetSelector);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    const draggedTargetElementId = await getElementId(page, 2, [0]);

    let renderedStyles: ICSSValues;

    // undoing dnd
    await clickCanvas(page, true);
    await contextMenu.undo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    // undone dnd: target board should no longer have stuff
    const dndGlassElemDisappeared = await waitForGlassElemToDisappear(page, draggedTargetElementId);
    const dndRendererElemDisappeared = await waitForRendererElemToDisappear(
      page,
      2,
      draggedTargetElementId
    );
    expect(dndGlassElemDisappeared).toBeTruthy(
      'un-dropped element at board 2 did not disappear from glass'
    );
    expect(dndRendererElemDisappeared).toBeTruthy(
      'un-dropped element at board 2 did not disappear from renderer'
    );

    // undone dnd: src elements should be still at src
    // board 0's
    renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['width', 'backgroundColor']);
    expect(renderedStyles).toEqual(
      { width: `${WIDTH_00}px`, backgroundColor: hexColorToRGB(BGCOLOR_00) },
      'mismatching styles for un-dropped element at board 0'
    );
    // board 1's
    renderedStyles = await getElementStyles(page, elemPos(1, [0]), DEFAULT_PRIMITIVE_STYLE_PROPS);
    expect(renderedStyles).toEqual(
      DEFAULT_PRIMITIVE_STYLES,
      'mismatching styles for un-dropped element at board 1'
    );

    // undo alpha
    await clickCanvas(page, true);
    await contextMenu.undo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['width', 'backgroundColor']);
    expect(renderedStyles).toEqual(
      {
        width: `${WIDTH_00}px`,
        backgroundColor: hexColorToRGB({
          ...BGCOLOR_00,
          opacityPercentage: 100,
        }),
      },
      'mismatching alpha for undone property change for element at board 0'
    );

    // undo color
    await clickCanvas(page, true);
    await contextMenu.undo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['width', 'backgroundColor']);
    expect(renderedStyles).toEqual(
      {
        width: `${WIDTH_00}px`,
        backgroundColor: DEFAULT_PRIMITIVE_STYLES.backgroundColor,
      },
      'mismatching bgColor for undone property change for element at board 0'
    );

    // undo width
    await clickCanvas(page, true);
    await contextMenu.undo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    renderedStyles = await getElementStyles(page, elemPos(0, [0]), DEFAULT_PRIMITIVE_STYLE_PROPS);
    expect(renderedStyles).toEqual(
      DEFAULT_PRIMITIVE_STYLES,
      'mismatching width & bgColor for undone property change for element at board 0'
    );

    // redo width.
    await clickCanvas(page, true);
    await contextMenu.redo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['width', 'backgroundColor']);
    expect(renderedStyles).toEqual(
      {
        width: `${WIDTH_00}px`,
        backgroundColor: DEFAULT_PRIMITIVE_STYLES.backgroundColor,
      },
      'mismatching width for redone property change for element at board 0'
    );

    // redo color
    await clickCanvas(page, true);
    await contextMenu.redo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['width', 'backgroundColor']);
    expect(renderedStyles).toEqual(
      {
        width: `${WIDTH_00}px`,
        backgroundColor: hexColorToRGB({
          ...BGCOLOR_00,
          opacityPercentage: 100,
        }),
      },
      'mismatching color for redone property change for element at board 0'
    );

    // redo alpha
    await clickCanvas(page, true);
    await contextMenu.redo(page);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['width', 'backgroundColor']);
    expect(renderedStyles).toEqual(
      { width: `${WIDTH_00}px`, backgroundColor: hexColorToRGB(BGCOLOR_00) },
      'mismatching alpha for redone property change for element at board 0'
    );

    // redo dnd
    const dragSource0Id = await getElementId(page, 0, [0]);
    const dragSource1Id = await getElementId(page, 1, [0]);

    await clickCanvas(page, true);
    await contextMenu.redo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    const dndGlassElem0Disappeared = await waitForGlassElemToDisappear(page, dragSource0Id);
    const dndRendererElem0Disappeared = await waitForRendererElemToDisappear(
      page,
      0,
      dragSource0Id
    );
    const dndGlassElem1Disappeared = await waitForGlassElemToDisappear(page, dragSource1Id);
    const dndRendererElem1Disappeared = await waitForRendererElemToDisappear(
      page,
      1,
      dragSource1Id
    );
    expect(dndGlassElem0Disappeared).toBeTruthy(
      'element did not disappear from glass for board 0 after redoing drag-and-drop'
    );
    expect(dndRendererElem0Disappeared).toBeTruthy(
      'element did not disappear from renderer for board 0 after redoing drag-and-drop'
    );
    expect(dndGlassElem1Disappeared).toBeTruthy(
      'element did not disappear from glass for board 1 after redoing drag-and-drop'
    );
    expect(dndRendererElem1Disappeared).toBeTruthy(
      'element did not disappear from renderer for board 1 after redoing drag-and-drop'
    );

    const rendered20Styles = await getElementStyles(page, elemPos(2, [0]), [
      'width',
      'backgroundColor',
    ]);
    expect(rendered20Styles).toEqual(
      { width: `${WIDTH_00}px`, backgroundColor: hexColorToRGB(BGCOLOR_00) },
      'mismatching styles for element 0 at board 2 after redoing drag-and-drop'
    );

    const rendered21Styles = await getElementStyles(
      page,
      elemPos(2, [1]),
      DEFAULT_PRIMITIVE_STYLE_PROPS
    );
    expect(rendered21Styles).toEqual(
      DEFAULT_PRIMITIVE_STYLES,
      'mismatching styles for element 1 at board 2 after redoing drag-and-drop'
    );
  });

  it('should rebind a theme color to elem props after undoing deletion of it', async () => {
    const COLOR_NAME = 'Primary';
    const COLOR_1: IHexColor = { hex: '#80ff00' };
    const COLOR_2: IHexColor = { hex: '#00ff80' };

    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);

    await selectAndViewBoard(page, 0);

    await changeNewElementsProps(page, { backgrounds: [COLOR_NAME] }, elemPos(0, [0]));

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await showThemePanel(page);

    await themePanel.changeColor(page, COLOR_NAME, COLOR_1);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    await themePanel.deleteColor(page, COLOR_NAME);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    // Undo and then re-change color. This tests immutability of undo-redo
    // with design systems.
    await clickBoard(page, 0, false, true);
    await contextMenu.undo(page);

    await themePanel.changeColor(page, COLOR_NAME, COLOR_2);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    let renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['backgroundColor']);

    expect(renderedStyles).toEqual(
      { backgroundColor: hexColorToRGB(COLOR_2) },
      'mismatching backgroundcolor for element at board 0'
    );

    // Undo again, see if we revert to the original rendered color.
    await clickBoard(page, 0, false, true);
    await contextMenu.undo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['backgroundColor']);

    expect(renderedStyles).toEqual(
      { backgroundColor: hexColorToRGB(COLOR_1) },
      'mismatching backgroundcolor for element at board 0'
    );

    // Redo again, and we should be back to the new color
    await clickBoard(page, 0, false, true);
    await contextMenu.redo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['backgroundColor']);

    expect(renderedStyles).toEqual(
      { backgroundColor: hexColorToRGB(COLOR_2) },
      'mismatching backgroundcolor for element at board 0'
    );
  });

  it('should keep a color unbound after redoing deletion of a theme color', async () => {
    const COLOR_NAME = 'Primary';
    const COLOR: IHexColor = { hex: '#80ff00' };

    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);

    await selectAndViewBoard(page, 0);

    await changeNewElementsProps(page, { backgrounds: [COLOR_NAME] }, elemPos(0, [0]));

    await page.waitForTimeout(INTERACTION_INTERVAL);

    await showThemePanel(page);

    await themePanel.changeColor(page, COLOR_NAME, COLOR);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    await themePanel.deleteColor(page, COLOR_NAME);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickBoard(page, 0, false, true);
    await contextMenu.undo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    await clickBoard(page, 0, false, true);
    await contextMenu.redo(page);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    // This tests immutability of flattening & unflattening design system values for colors
    // including:
    // - 1. We've redone the deletion of the theme color, so in the props panel it should unbind.
    // TODO This top-level e2e-spec should have less reliance on selectors directly
    //               (i.e. we should have a util function for this for abstraction.)
    await page.waitForSelector(selectors.PROPS_BACKGROUND_COLOR_INPUT_CHIP(cssNth(0)), {
      hidden: true,
    });

    // - 2. The rendered color should be the color we changed to earlier
    const renderedStyles = await getElementStyles(page, elemPos(0, [0]), ['backgroundColor']);

    expect(renderedStyles).toEqual(
      { backgroundColor: hexColorToRGB(COLOR) },
      'mismatching backgroundcolor for element at board 0'
    );
  });
});
