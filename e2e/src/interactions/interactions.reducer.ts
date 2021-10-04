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
import { INTERACTION_TYPE_MENU } from 'src/app/routes/project/components/properties/actions-panel/action-panel.config';
import { getPropsPanelState } from '../ui-utils/components/props-panel.utils';
import { INTERACTION_INTERVAL, PREVIEW_LAUNCH_DELAY } from '../configs/timing.configs';
import { INPUT_GROUP, SELECT_INPUT } from '../consts/query-selectors';
import { ITestBehavior, BehaviorType } from '../consts/tests.interface';
import { symbolsBehaviorReducer } from '../symbols/symbols.reducer';
import * as dropdown from '../ui-utils/components/dropdown.utils';
import * as preview from '../ui-utils/preview.utils';
import * as consts from './interactions.consts';
import * as cd from 'cd-interfaces';
import { sharedBehaviorReducer, selectElementAndViewBoard } from '../shared/reducer.e2e-utils';

const clickSymbolChildPreview = async (behavior: ITestBehavior, page: Page) => {
  const elementIndices = behavior.elementIndices ?? [0];
  await preview.clickSymbolChild(page, behavior.target, elementIndices);
  await page.waitForTimeout(PREVIEW_LAUNCH_DELAY);
};

const selectMenuAndSetValue = async (page: Page, selector: string, menuOption: string) => {
  const selectType = await page.waitForSelector(`${selector} ${SELECT_INPUT}`);
  await selectType.click();
  await dropdown.select(page, menuOption);
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

const resetPrototype = async (page: Page) => {
  const resetButton = await page.waitForSelector("button[data-tooltip='Reset prototype']");
  await resetButton.click();
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

const startRecording = async (behavior: ITestBehavior, page: Page) => {
  if (behavior.boardIndex !== undefined && behavior.elementIndices?.length !== 0) {
    await selectElementAndViewBoard(behavior, page);
  }

  const selectActionPanel = await page.waitForSelector(getPropsPanelState(2));
  await selectActionPanel.click();

  await page.waitForTimeout(INTERACTION_INTERVAL);

  const recordButton = await page.waitForSelector('app-actions-card .form .cd-outlined-button');
  recordButton.click();

  await page.waitForTimeout(INTERACTION_INTERVAL);
};

const stopRecording = async (_behavior: ITestBehavior, page: Page) => {
  const recordButton = await page.waitForSelector('.record-btn');
  recordButton.click();
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

const addAction = async (behavior: ITestBehavior, page: Page) => {
  if (behavior.boardIndex !== undefined && behavior.elementIndices?.length !== 0) {
    await selectElementAndViewBoard(behavior, page);
  }

  const selectActionPanel = await page.waitForSelector(getPropsPanelState(2));
  await selectActionPanel.click();

  await page.waitForTimeout(INTERACTION_INTERVAL);

  const addButton = await page.waitForSelector(
    `${consts.ACTION_PANEL_SELECTOR} cd-menu-button button`
  );

  addButton.click();

  await page.waitForTimeout(INTERACTION_INTERVAL);

  const typeOptionIdx = INTERACTION_TYPE_MENU.findIndex((item) => item.value === behavior.value);
  if (typeOptionIdx === -1) return console.error('unknown menu option');
  const menuSelector = `cd-menu > ul > li:nth-child(${typeOptionIdx + 1})`;
  const selectType = await page.waitForSelector(menuSelector);
  await selectType.click();
  await page.waitForTimeout(INTERACTION_INTERVAL);

  if (behavior.value === cd.ActionType.SwapPortal) {
    if (!behavior.portal) return console.error('Missing portal for swap portal');
    const targetDropdown = `${consts.ACTION_PANEL_SELECTOR} ${INPUT_GROUP('Portal')}`;
    await selectMenuAndSetValue(page, targetDropdown, behavior.portal);
  }

  if (behavior.from) {
    const fromDropdown = `${consts.ACTION_PANEL_SELECTOR} ${INPUT_GROUP('From')}`;
    await selectMenuAndSetValue(page, fromDropdown, behavior.from);
  }

  if (behavior.target) {
    const targetDropdown = `${consts.ACTION_PANEL_SELECTOR} ${INPUT_GROUP('Target')}`;
    await selectMenuAndSetValue(page, targetDropdown, behavior.target);
  }

  if (behavior.top) {
    const topSelector = `${consts.ACTION_PANEL_SELECTOR} ${INPUT_GROUP('Top')} input`;
    const topCheckbox = await page.waitForSelector(topSelector);
    await topCheckbox.click();
  }
  const selectDefaultProps = await page.waitForSelector(getPropsPanelState());
  await selectDefaultProps.click();
};

export const interactionsBehaviorReducer = (behavior: ITestBehavior, page: Page) => {
  // prettier-ignore
  switch (behavior.type) {
    case BehaviorType.AddAction:                  return addAction(behavior, page);
    case BehaviorType.ResetPrototype:             return resetPrototype(page);
    case BehaviorType.StartRecording:             return startRecording(behavior, page);
    case BehaviorType.StopRecording:              return stopRecording(behavior, page);
    case BehaviorType.ClickSymbolChildPreview:    return clickSymbolChildPreview(behavior, page);

    // use Symbols behavior reducer here instead
    case BehaviorType.IsolationSelectElement:
    case BehaviorType.IsolationShiftClickElement:
    case BehaviorType.IsolationRightClickElement:
    case BehaviorType.ExitSymbolIsolationMode:    return symbolsBehaviorReducer(behavior, page);
    default:                                      return sharedBehaviorReducer(behavior, page);
  }
};
