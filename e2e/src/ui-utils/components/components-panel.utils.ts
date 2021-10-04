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
import { INTERACTION_INTERVAL } from 'e2e/src/configs/timing.configs';

/**
 * This function is non-trivial: If you want to get a component from a library,
 * You need to first make sure the library is loaded, and then you can poke
 * the DOM.
 */
export const findComponentFromList = async (
  page: Page,
  label: string
): Promise<ElementHandle<Element> | null> => {
  // TODO -- Waiting for processing of library data -> component UIs available in the panel
  //                  Should be a better mechanism than a hardcoded interval
  await page.waitForTimeout(INTERACTION_INTERVAL);

  const allComps = await page.$$(selectors.COMPONENT_PANEL_ALL_BUTTONS);

  for (const comp of allComps) {
    const innerText = await page.evaluate((ctxComp) => ctxComp.innerText, comp);
    if (innerText === label) return comp;
  }

  return null;
};
