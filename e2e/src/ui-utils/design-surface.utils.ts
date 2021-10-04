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
import { POLLING } from '../consts/puppeteer.consts';
import { IElementPosition } from '../models/elements.interface';
import { dragAndDropBySel, dragAndDrop } from './common/dnd.utils';
import { IPropsChanges, ICSSValues } from '../models/props.interfaces';
import { findComponentFromList } from './components/components-panel.utils';
import { INTERACTION_INTERVAL } from '../configs/timing.configs';
import { isHexColorProp, isDSColorProp } from '../utils/props.utils';
import * as activityBar from './components/activity-bar.utils';
import * as contextMenu from './components/context-menu.utils';
import * as canvas from './components/canvas.utils';
import * as propsPanel from './components/props-panel.utils';
import * as renderer from './components/renderer.utils';
import * as selectors from '../consts/query-selectors';
import * as utils from './common/id.utils';
import * as cd from 'cd-interfaces';

export const addNewBoard = async (page: Page) => {
  const boardCount = (await page.$$(selectors.GLASS_OUTLET_FRAME_GROUP)).length;
  const button = await page.waitForSelector(selectors.ADD_BOARD_BUTTON);
  await button.click();
  await page.waitForFunction(
    (newBoardCount, selector) => document.querySelectorAll(selector).length === newBoardCount,
    POLLING,
    boardCount + 1,
    selectors.GLASS_OUTLET_FRAME_GROUP
  );
};

export const dragElementFromComponentToBoard = async (
  page: Page,
  boardIndex: number,
  element: cd.ElementEntitySubType = cd.ElementEntitySubType.Generic
) => {
  await activityBar.showComponentsPanel(page);
  const boardSelector = await utils.glassBoardSelector(page, boardIndex);
  const elementSelector = selectors.ELEMENT_FROM_COMPONENTS_PANEL(element);
  await dragAndDropBySel(page, elementSelector, boardSelector);
};

export const dragElementFromComponentInIsolation = async (
  page: Page,
  element: cd.ElementEntitySubType = cd.ElementEntitySubType.Generic
) => {
  const boardSelector = selectors.SYMBOL_ISOLATION_GLASS_OUTLET_FRAME;
  const elementSelector = selectors.ELEMENT_FROM_COMPONENTS_PANEL(element);
  await dragAndDropBySel(page, elementSelector, boardSelector);
};

export const dragIconFromComponentToBoard = async (page: Page, boardIndex: number) => {
  return await dragElementFromComponentToBoard(page, boardIndex, cd.ElementEntitySubType.Icon);
};

export const dragComponentToBoard = async (page: Page, name: string, boardIndex: number) => {
  await activityBar.showComponentsPanel(page);
  const component = await findComponentFromList(page, name);
  if (!component) throw Error(`Could not find component named ${name}`);
  await page.evaluate((ctxComp) => ctxComp.scrollIntoView(), component);
  await page.waitForTimeout(INTERACTION_INTERVAL);
  const boardSelector = await utils.glassBoardSelector(page, boardIndex);
  const board = await page.waitForSelector(boardSelector);
  await dragAndDrop(page, component, board);
};

export const getElementStyles = async (
  page: Page,
  { boardIndex, indices }: IElementPosition,
  props: string[]
): Promise<ICSSValues> => {
  const iframeSelector = await utils.canvasIframeSelector(page, boardIndex);
  const iframe = await page.waitForSelector(iframeSelector);
  const elementSelector = await utils.rendererElementSelector(page, boardIndex, indices);

  return await renderer.getElementStyles(iframe, elementSelector, props);
};

export const getElementStylesById = async (
  page: Page,
  id: string,
  props: string[],
  childId?: string
) => {
  const iframeSelector = selectors.CANVAS_IFRAME(id);
  const iframe = await page.waitForSelector(iframeSelector);
  const elementSelector = selectors.getRenderedElementSelector(id);
  const childSelector = childId ? ` ${selectors.getDataIdSelector(childId)}` : '';
  const selector = `${elementSelector}${childSelector}`;

  return await renderer.getElementStyles(iframe, selector, props);
};

export const getInstanceChildElementStyles = async (
  page: Page,
  boardIndex: number,
  instanceId: string,
  childId: string,
  props: string[]
): Promise<ICSSValues> => {
  const iframeSelector = await utils.canvasIframeSelector(page, boardIndex);
  const iframe = await page.waitForSelector(iframeSelector);
  const instanceSelector = selectors.getRenderedElementSelector(instanceId);
  const childSelector = selectors.getDataIdSelector(childId);
  const selector = `${instanceSelector} ${childSelector}`;

  return await renderer.getElementStyles(iframe, selector, props);
};

export const changeNewElementsProps = async (
  page: Page,
  props: Partial<IPropsChanges>,
  position?: IElementPosition
) => {
  const {
    width,
    height,
    opacityPercentage,
    radius,
    backgrounds,
    borders,
    shadows,
    innerShadows,
    color,
  } = props;

  if (position) await canvas.clickElement(page, position);

  if (width) {
    await propsPanel.changeElemWidth(page, width);
    await page.waitForTimeout(INTERACTION_INTERVAL);
  }
  if (height) {
    await propsPanel.changeElemHeight(page, height);
    await page.waitForTimeout(INTERACTION_INTERVAL);
  }
  if (opacityPercentage) {
    await propsPanel.changeOpacity(page, opacityPercentage);
    await page.waitForTimeout(INTERACTION_INTERVAL);
  }
  if (radius) {
    await propsPanel.changeRadius(page, radius);
    await page.waitForTimeout(INTERACTION_INTERVAL);
  }
  if (color) {
    if (isHexColorProp(color)) {
      await propsPanel.changeColor(page, color);
      await page.waitForTimeout(INTERACTION_INTERVAL);
    }
    // TODO set color from design system
  }
  if (backgrounds) {
    if (backgrounds.length > 1) {
      throw new Error('multiple backgrounds not supported yet :(');
    }
    const bg = backgrounds[0];
    if (isHexColorProp(bg)) {
      await propsPanel.changeBackground(page, 0, bg);
    } else if (isDSColorProp(bg)) {
      await propsPanel.changeBackgroundDS(page, 0, bg);
    } else {
      throw new Error(`unrecognized background type for: ${JSON.stringify(bg)}`);
    }
    await page.waitForTimeout(INTERACTION_INTERVAL);
  }
  if (borders) {
    for (const [i, border] of borders.entries()) {
      await propsPanel.addBorder(page);
      await page.waitForSelector('cd-border-input');
      await propsPanel.changeBorder(page, i, border);
      await page.waitForTimeout(INTERACTION_INTERVAL);
    }
  }
  if (shadows) {
    for (const [i, shadow] of shadows.entries()) {
      await propsPanel.addShadow(page, false);
      await page.waitForSelector(selectors.PROPS_GROUP_NTH_LIST_ITEM('Shadow', 1));
      await propsPanel.changeShadow(page, false, i, shadow);
      await page.waitForTimeout(INTERACTION_INTERVAL);
    }
  }
  if (innerShadows) {
    for (const [i, shadow] of innerShadows.entries()) {
      await propsPanel.addShadow(page, true);
      await page.waitForSelector(selectors.PROPS_GROUP_NTH_LIST_ITEM('Inner Shadow', 1));
      await propsPanel.changeShadow(page, true, i, shadow);
      await page.waitForTimeout(INTERACTION_INTERVAL);
    }
  }
};

export const changeElementNavigateToBoard = async (
  page: Page,
  position: IElementPosition,
  boardName: string
) => {
  await canvas.clickElement(page, position);
  await propsPanel.changeNavigateToBoard(page, boardName);
};

// TODO
export const launchPreview = async (page: Page, boardIndex: number) => {
  await canvas.selectAndViewBoard(page, boardIndex);
  await canvas.clickBoard(page, boardIndex, false, true);
  await contextMenu.previewBoard(page);
};

export const waitForIFrame = async (page: Page, index: number) => {
  const selector = await utils.canvasIframeSelector(page, index);
  return await page.waitForSelector(selector);
};

export const waitForGlassBoard = async (page: Page, index: number) => {
  const selector = await utils.glassBoardSelector(page, index);
  return await page.waitForSelector(selector);
};

export const waitForGlassElement = async (
  page: Page,
  { boardIndex, indices }: IElementPosition
) => {
  const selector = await utils.glassElementSelector(page, boardIndex, indices);
  return await page.waitForSelector(selector);
};

export const waitForRendererElemToDisappear = async (
  page: Page,
  boardIndex: number,
  id: string
): Promise<boolean> => {
  const iframeSelector = await utils.canvasIframeSelector(page, boardIndex);
  const iframe = await page.waitForSelector(iframeSelector);
  const elemSelector = selectors.getRenderedElementSelector(id);
  await renderer.waitForElementToDisappear(iframe, elemSelector);
  return true;
};

export const waitForGlassElemToDisappear = async (page: Page, id: string): Promise<boolean> => {
  const selector = await selectors.GLASS_ELEMENT(id);
  await page.waitForSelector(selector, { hidden: true });
  return true;
};

export const waitForIFrameToDisappear = async (page: Page, id: string) => {
  return !(await page.waitForSelector(selectors.CANVAS_IFRAME(id), { hidden: true }));
};

export const waitForGlassBoardToDisappear = async (page: Page, id: string) => {
  return !(await page.waitForSelector(selectors.GLASS_OUTLET_FRAME(id), { hidden: true }));
};
