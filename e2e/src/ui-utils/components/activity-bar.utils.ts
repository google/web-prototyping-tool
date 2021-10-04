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
import * as selectors from '../../consts/query-selectors/';
import { PANEL_TOGGLE_DELAY } from '../../configs/timing.configs';

export const isButtonActive = async (
  page: Page,
  button: ElementHandle<Element>
): Promise<boolean> => {
  const active = await page.evaluate(
    (docButton: HTMLButtonElement) => docButton.classList.contains('active'),
    button
  );

  return active;
};

// TODO to testing actual dimensions/visibility
export const showHidePanel = async (page: Page, buttonSelector: string, show: boolean) => {
  const button = await page.waitForSelector(buttonSelector);
  const active = await isButtonActive(page, button);
  if ((active && show) || (!active && !show)) return;
  await button.click();
  await page.waitForTimeout(PANEL_TOGGLE_DELAY);
};

export const showComponentsPanel = async (page: Page) => {
  await showHidePanel(page, selectors.ACTIVITY_BAR_COMPONENTS, true);
};

export const showLayersPanel = async (page: Page) => {
  await showHidePanel(page, selectors.ACTIVITY_BAR_LAYERS, true);
};

export const hideLayersPanel = async (page: Page) => {
  await showHidePanel(page, selectors.ACTIVITY_BAR_LAYERS, false);
};

export const showThemePanel = async (page: Page) => {
  await showHidePanel(page, selectors.ACTIVITY_BAR_THEME, true);
};
