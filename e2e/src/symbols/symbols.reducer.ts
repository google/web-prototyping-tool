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
import { exitSymbolIsolationMode } from '../ui-utils/components/top-bar.utils';
import { ITestBehavior, BehaviorType } from '../consts/tests.interface';
import { INTERACTION_INTERVAL } from '../configs/timing.configs';
import { sharedBehaviorReducer } from '../shared/reducer.e2e-utils';
import * as canvas from '../ui-utils/components/canvas.utils';
import * as surfaceUtils from '../ui-utils/design-surface.utils';

const addElementInIsolation = async (behavior: ITestBehavior, page: Page) => {
  await surfaceUtils.dragElementFromComponentInIsolation(page, behavior.target);
};

const selectElementInIsolation = async (
  behavior: ITestBehavior,
  page: Page,
  shiftClick = false,
  rightClick = false
) => {
  await canvas.clickBoardInIsolation(page);

  await page.waitForTimeout(INTERACTION_INTERVAL);

  await canvas.clickSymbolChild(page, behavior.elementIndices, shiftClick, rightClick);
};

export const symbolsBehaviorReducer = (behavior: ITestBehavior, page: Page) => {
  // prettier-ignore
  switch (behavior.type) {
    case BehaviorType.IsolationAddElement:        return addElementInIsolation(behavior, page);

    // NOTE: These actions are 1-based indexing since this uses the layers panel to select the element!
    case BehaviorType.IsolationSelectElement:     return selectElementInIsolation(behavior, page);
    case BehaviorType.IsolationShiftClickElement: return selectElementInIsolation(behavior, page, true);
    case BehaviorType.IsolationRightClickElement: return selectElementInIsolation(behavior, page, false, true);

    case BehaviorType.ExitSymbolIsolationMode:    return exitSymbolIsolationMode(page);
    default:                                      return sharedBehaviorReducer(behavior, page);
  }
};
