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

import { ITestBehavior, BehaviorType } from '../consts/tests.interface';
import { Page } from 'puppeteer';
import { elemPos } from '../utils/elements';
import { getElementPropertiesData } from '../utils/project.utils';
import { SELECT_INPUT, INPUT_GROUP_NG_REFLECT_LABEL } from '../consts/query-selectors';
import { INTERACTION_INTERVAL, PREVIEW_LAUNCH_DELAY } from '../configs/timing.configs';
import { changeFrameHeight, changeFrameWidth } from '../ui-utils/components/props-panel.utils';
import { KEYS } from '../utils/cd-utils-keycodes.utils';
import { getElementId } from '../ui-utils/common/id.utils';
import { IHexColor } from '../models/props.interfaces';
import * as canvas from '../ui-utils/components/canvas.utils';
import * as surfaceUtils from '../ui-utils/design-surface.utils';
import * as contextMenu from '../ui-utils/components/context-menu.utils';
import * as confirmationDialog from '../ui-utils/components/confirmation-dialog.utils';
import * as dropdown from '../ui-utils/components/dropdown.utils';
import * as routes from '../ui-utils/routes.utils';
import * as preview from '../ui-utils/preview.utils';

const reportProjectData = async (page: Page) => {
  console.log(await getElementPropertiesData(page));
};

const positionFromBehavior = (behavior: ITestBehavior) => {
  const elementIndices = behavior.elementIndices ?? [0];
  const boardIndex = behavior.boardIndex ?? 0;
  return elemPos(boardIndex, elementIndices);
};

const addBoard = async (behavior: ITestBehavior, page: Page) => {
  await surfaceUtils.addNewBoard(page);
  await canvas.selectAndViewBoard(page, behavior.boardIndex);
};

const selectBoard = async (behavior: ITestBehavior, page: Page) => {
  await canvas.selectAndViewBoard(page, behavior.boardIndex, behavior.symbolIsolation);
};

const addElement = async (behavior: ITestBehavior, page: Page) => {
  const boardIndex = behavior.boardIndex || 0;
  await surfaceUtils.dragElementFromComponentToBoard(page, boardIndex, behavior.target);
};

export const selectElementAndViewBoard = async (
  behavior: ITestBehavior,
  page: Page,
  shiftClick = false,
  rightClick = false
) => {
  if (!shiftClick && !rightClick) {
    await selectBoard(behavior, page);
  }

  const position = positionFromBehavior(behavior);
  await canvas.clickElement(page, position, shiftClick, rightClick);
};

const clickInContextMenu = async (behavior: ITestBehavior, page: Page) => {
  if (!behavior.menuConfig) return console.log('Missing menuConfig');
  if (behavior.boardIndex !== undefined && behavior.elementIndices?.length !== 0) {
    await selectElementAndViewBoard(behavior, page, false, true);
  }

  await contextMenu.clickItem(behavior.menuConfig, page);
};

const setProperties = async (behavior: ITestBehavior, page: Page) => {
  const { props, elementIndices, boardIndex } = behavior;
  if (!props) return console.log('Missing props');
  const position =
    elementIndices !== undefined && boardIndex !== undefined
      ? positionFromBehavior(behavior)
      : undefined;

  await surfaceUtils.changeNewElementsProps(page, props, position);
};

const confirmConfirmationDialog = async (page: Page) => {
  await confirmationDialog.confirmDialog(page);
};

const selectMenuAndSetValue = async (page: Page, selector: string, menuOption: string) => {
  const selectType = await page.waitForSelector(`${selector} ${SELECT_INPUT}`);
  await selectType.click();
  await dropdown.select(page, menuOption);
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

const setPortalDestination = async (behavior: ITestBehavior, page: Page) => {
  await selectElementAndViewBoard(behavior, page);
  const selector = `${INPUT_GROUP_NG_REFLECT_LABEL('Portal to')}`;
  await selectMenuAndSetValue(page, selector, behavior.target);
};

const changeFrameSize = async (page: Page, height?: number | undefined, width?: number) => {
  if (height) {
    await changeFrameHeight(page, height);
  }

  if (width) {
    await changeFrameWidth(page, width);
  }
};

const deleteBoard = async (behavior: ITestBehavior, page: Page) => {
  await canvas.selectBoardAndSnap(page, behavior.boardIndex);
  await page.keyboard.press(KEYS.Delete);
  await page.waitForTimeout(INTERACTION_INTERVAL);
};

const deleteElement = async (behavior: ITestBehavior, page: Page) => {
  await selectElementAndViewBoard(behavior, page);
  const position = positionFromBehavior(behavior);
  const elementId = await getElementId(page, position.boardIndex, position.indices);
  await page.keyboard.press(KEYS.Delete);
  await surfaceUtils.waitForRendererElemToDisappear(page, 0, elementId);
};

const setRandomBackgroundColor = async (behavior: ITestBehavior, page: Page) => {
  const randHex = '#' + Math.floor(Math.random() * 16777215).toString(16);
  const position = positionFromBehavior(behavior);
  const randColor: IHexColor = { hex: randHex, opacityPercentage: 100 };
  await surfaceUtils.changeNewElementsProps(page, { backgrounds: [randColor] }, position);
};

const gotoPreview = async (behavior: ITestBehavior, page: Page) => {
  const boardIndex = behavior.boardIndex ?? 0;
  await surfaceUtils.launchPreview(page, boardIndex);
  await routes.waitForPreview(page);
  await preview.waitForIFrame(page);
  await page.waitForTimeout(PREVIEW_LAUNCH_DELAY);
};

const clickPreview = async (behavior: ITestBehavior, page: Page) => {
  const elementIndices = behavior.elementIndices ?? [0];
  await preview.clickElement(page, elementIndices);
  await page.waitForTimeout(PREVIEW_LAUNCH_DELAY);
};

export const sharedBehaviorReducer = (behavior: ITestBehavior, page: Page) => {
  // prettier-ignore
  switch (behavior.type) {
    case BehaviorType.AddBoard: return addBoard(behavior, page);
    case BehaviorType.AddElement: return addElement(behavior, page);
    case BehaviorType.SelectBoard: return selectBoard(behavior, page);
    case BehaviorType.SelectElement: return selectElementAndViewBoard(behavior, page);
    case BehaviorType.RightClickElement: return selectElementAndViewBoard(behavior, page, false, true);
    case BehaviorType.ShiftClickElement: return selectElementAndViewBoard(behavior, page, true);
    case BehaviorType.ContextMenu: return clickInContextMenu(behavior, page);
    case BehaviorType.ConfirmConfirmationDialog: return confirmConfirmationDialog(page);
    case BehaviorType.SetProperties: return setProperties(behavior, page);
    case BehaviorType.ReportProjectData: return reportProjectData(page);
    case BehaviorType.ClearSelection: return canvas.clearSelection(page);
    case BehaviorType.SetPortal: return setPortalDestination(behavior, page);
    case BehaviorType.ChangeFrameHeight: return changeFrameSize(page, behavior.target);
    case BehaviorType.ChangeFrameWidth: return changeFrameSize(page, undefined, behavior.target);
    case BehaviorType.DeleteBoard: return deleteBoard(behavior, page);
    case BehaviorType.DeleteElement: return deleteElement(behavior, page);
    case BehaviorType.SetRandomBackgroundColor: return setRandomBackgroundColor(behavior, page);
    case BehaviorType.GoToPreview: return gotoPreview(behavior, page);
    case BehaviorType.ClickPreview: return clickPreview(behavior, page);
    default: return;
  }
};
