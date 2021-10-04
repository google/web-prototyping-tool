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
import * as selectors from '../../consts/query-selectors/';
import { SHADOW_DIMENSION_SHORTHANDS } from '../../consts/styles.consts';
import { IHexColor, IBorder, IShadow } from '../../models/props.interfaces';
import { cssNth } from '../../utils/styles.utils';
import * as colorPicker from './color-picker.utils';
import { enterTextInput, getElementCssClasses } from '../common/dom.utils';
import * as dropdown from './dropdown.utils';
import { INTERACTION_INTERVAL } from 'e2e/src/configs/timing.configs';
import { ACTION_PANEL_SELECTOR } from 'e2e/src/interactions/interactions.consts';

const waitForSelectorWhoFinishesFirst = (page: Page, ...sels: string[]) => {
  return Promise.race(
    sels.map((selector) => page.waitForSelector(selector, { timeout: 4000, visible: true }).catch())
  );
};

export const changeFrameWidth = async (page: Page, width: number) => {
  const input = await waitForSelectorWhoFinishesFirst(
    page,
    selectors.PROPS_PANEL_GENERIC_SIZE_WIDTH,
    selectors.PROPS_PANEL_INITIAL_SIZE_WIDTH
  );
  await enterTextInput(input, width.toString());
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

export const changeFrameHeight = async (page: Page, height: number) => {
  const input = await waitForSelectorWhoFinishesFirst(
    page,
    selectors.PROPS_PANEL_GENERIC_SIZE_HEIGHT,
    selectors.PROPS_PANEL_INITIAL_SIZE_HEIGHT
  );
  await enterTextInput(input, height.toString());
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

export const changeElemWidth = async (page: Page, width: number) => {
  const input = await page.waitForSelector(selectors.PROPS_PANEL_ELEM_SIZE_WIDTH);
  await enterTextInput(input, width.toString());
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

export const changeElemHeight = async (page: Page, height: number) => {
  const input = await page.waitForSelector(selectors.PROPS_PANEL_ELEM_SIZE_HEIGHT);
  await enterTextInput(input, height.toString());
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

export const changeOpacity = async (page: Page, opacityPercentage: number) => {
  const input = await page.waitForSelector(selectors.PROPS_PANEL_OPACITY_INPUT);
  await enterTextInput(input, opacityPercentage.toString());
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

export const changeColor = async (page: Page, color: IHexColor) => {
  const colorInput = await page.waitForSelector(selectors.PROPS_PANEL_COLOR_INPUT);
  const colorInputClasses = await getElementCssClasses(colorInput);
  const hasBinding = colorInputClasses.includes(selectors.CD_COLOR_INPUT_SHOW_CHIP);

  // remove design chip if present
  if (hasBinding) {
    const closeButton = await colorInput.$(selectors.CHIP_CLOSE_BUTTON);
    if (closeButton) {
      closeButton.click();
      await page.waitForTimeout(INTERACTION_INTERVAL);
    }
  }

  const swatchButton = await colorInput.$(selectors.COLOR_SWATCH);
  if (swatchButton) {
    await swatchButton.click();
    await colorPicker.setHexAndAlpha(page, color);
    await page.waitForTimeout(INTERACTION_INTERVAL);
  }
};

export const changeRadius = async (page: Page, radius: number) => {
  const input = await page.waitForSelector(selectors.PROPS_PANEL_RADIUS_INPUT);
  await enterTextInput(input, radius.toString());
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

export const changeBackground = async (page: Page, index: number, color: IHexColor) => {
  const nthItem = cssNth(index);
  const swatchSelector = selectors.PROPS_BACKGROUND_COLOR_SWATCH(nthItem);
  const swatchButton = await page.waitForSelector(swatchSelector);

  await swatchButton.focus(); // < Fix for flakey E2E
  await swatchButton.click();

  await colorPicker.setHexAndAlpha(page, color);
};

export const changeBackgroundDS = async (page: Page, index: number, colorName: string) => {
  const nthItem = cssNth(index);
  const inputSelector = selectors.PROPS_BACKGROUND_COLOR_INPUT_INPUT(nthItem);
  const input = await page.waitForSelector(inputSelector);
  await input.click();
  await dropdown.select(page, colorName);
};

export const addPropsGroupItem = async (page: Page, group: string) => {
  const button = await page.waitForSelector(selectors.PROPS_GROUP_ADD_BUTTON(group));
  await button.click();
};

export const addBorder = async (page: Page) => {
  const borderSelector = 'cd-property-group[ng-reflect-group-title="Border"] cd-menu-button button';
  const addButton = await page.waitForSelector(borderSelector);
  addButton.click();
  await page.waitForTimeout(INTERACTION_INTERVAL);
  const menuSelector = `cd-menu > ul > li:nth-child(1)`;
  const selectType = await page.waitForSelector(menuSelector);
  await selectType.click();
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

// needs to assign which border
export const changeBorder = async (page: Page, _index: number, border: IBorder) => {
  const { color, width, style } = border;

  const propListItemSelector = 'cd-border-input';
  const switchSelector = `${propListItemSelector} button.swatch-holder`;

  const swatchButton = await page.waitForSelector(switchSelector);
  await swatchButton.click();
  await colorPicker.setHexAndAlpha(page, color);

  const widthInput = await page.waitForSelector(
    `${propListItemSelector} ${selectors.INPUT_DEEP_INPUT_BY_TYPE('number')}`
  );

  await enterTextInput(widthInput, width.toString());
  await page.waitForTimeout(INTERACTION_INTERVAL);

  const selectInput = await page.waitForSelector(
    `${propListItemSelector} ${selectors.SELECT_INPUT}`
  );
  await selectInput.click();

  await dropdown.select(page, style);
};

export const addShadow = async (page: Page, inner: boolean) => {
  const title = inner ? 'Inner Shadow' : 'Shadow';
  await addPropsGroupItem(page, title);
};

export const changeShadow = async (page: Page, inner: boolean, index: number, shadow: IShadow) => {
  const title = inner ? 'Inner Shadow' : 'Shadow';
  const { color } = shadow;
  const nthItem = cssNth(index);

  const propListItemSelector = `${selectors.PROPS_GROUP_NTH_LIST_ITEM(title, nthItem)}`;

  // color
  const swatchButton = await page.waitForSelector(`${propListItemSelector} button.content`);
  await swatchButton.click();
  await colorPicker.setHexAndAlpha(page, color);

  // x, y, b, s
  for (const [i, shorthand] of SHADOW_DIMENSION_SHORTHANDS.entries()) {
    const nthInput = cssNth(i);
    const selector = `${propListItemSelector} ${selectors.INPUT_DEEP_INPUT_BY_NTH_TYPE(
      'number',
      nthInput
    )}`;
    const input = await page.waitForSelector(selector);
    await enterTextInput(input, ((shadow as any)[shorthand] as number).toString());
    await page.waitForTimeout(INTERACTION_INTERVAL);
  }
};

/** 1 = Default, 2 = Actions, 3 = Code */
export const getPropsPanelState = (state = 1) => {
  return `.properties-header cd-tab-group li:nth-child(${state})`;
};

export const changeNavigateToBoard = async (page: Page, boardName: string) => {
  const selectActionPanel = await page.waitForSelector(getPropsPanelState(2));
  await selectActionPanel.click();
  await page.waitForTimeout(INTERACTION_INTERVAL);

  const addButton = await page.waitForSelector(`${ACTION_PANEL_SELECTOR} cd-menu-button button`);
  addButton.click();
  await page.waitForTimeout(INTERACTION_INTERVAL);

  const navigateToBoardSelector = `cd-menu > ul > li:nth-child(1)`;
  const selectType = await page.waitForSelector(navigateToBoardSelector);
  await selectType.click();
  await page.waitForTimeout(INTERACTION_INTERVAL);

  const select = await page.waitForSelector(
    `${selectors.INPUT_GROUP('Target')} ${selectors.SELECT_INPUT}`
  );
  await select.click();
  await dropdown.select(page, boardName);
  await page.waitForTimeout(INTERACTION_INTERVAL);
  const selectDefaultProps = await page.waitForSelector(getPropsPanelState());
  await selectDefaultProps.click();
};

export const toggleComponentInputSwitch = async (page: Page, inputName: string) => {
  const switchInput = await page.waitForSelector(selectors.PROPS_COMP_SWITCH_INPUT(inputName));
  await switchInput.click();
};
