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
import * as selectors from '../consts/query-selectors/';

export const clickCreateProjectButton = async (page: Page) => {
  await page.waitForSelector(selectors.NEW_PROJECT_BUTTON);
  await page.click(selectors.NEW_PROJECT_BUTTON);
};

export const clickCreateEmptyTemplate = async (page: Page) => {
  await page.click(selectors.BLANK_TEMPLATE_ENTRY);
  await page.click(selectors.CREATE_PROJECT_OK_BUTTON);
};