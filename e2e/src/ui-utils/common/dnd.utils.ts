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
import { INTERACTION_INTERVAL } from '../../configs/timing.configs';
import { DRAG_INITIAL_START } from '../../configs/dnd.configs';
import { getElemCenterPoint } from './dom.utils';

export const dragAndDropBySel = async (
  page: Page,
  sourceSelector: string,
  targetSelector: string
) => {
  const sourceElem = await page.waitForSelector(sourceSelector);
  const targetElem = await page.waitForSelector(targetSelector);

  await dragAndDrop(page, sourceElem, targetElem);
};

// TODO: We probably need "offset" positions for target.
export const dragAndDrop = async (
  page: Page,
  source: ElementHandle<Element>,
  target: ElementHandle<Element>
) => {
  const { x: sourceX, y: sourceY } = await getElemCenterPoint(source);
  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(sourceX + DRAG_INITIAL_START, sourceY + DRAG_INITIAL_START);

  await page.waitForTimeout(INTERACTION_INTERVAL);

  const { x: targetX, y: targetY } = await getElemCenterPoint(target);
  await page.mouse.move(targetX, targetY);

  await page.waitForTimeout(INTERACTION_INTERVAL);
  await page.mouse.up();
};
