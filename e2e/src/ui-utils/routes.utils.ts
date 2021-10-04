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
import { pause } from '../utils/tests.utils';
import { trimStart } from 'cd-utils/string';
import * as configs from '../utils/configs.utils';
import * as selectors from '../consts/query-selectors/';

const GOTO_TIMEOUT = 30000;
const DEFAULT_ALLOW_LOAD_TIME = 500;

/** Navigate to a specific relative URL within the application. */
export const navigateTo = async (
  page: Page,
  relativeUrl: string,
  allowLoadTime = DEFAULT_ALLOW_LOAD_TIME
) => {
  const baseUrl = await configs.baseUrl();
  if (relativeUrl.startsWith('/')) relativeUrl = trimStart('/', relativeUrl);
  const absoluteUrl = baseUrl + relativeUrl;
  console.log(`Navigating to: ${relativeUrl}`);
  await page.goto(absoluteUrl, { timeout: GOTO_TIMEOUT });
  if (allowLoadTime > 0) {
    await pause(allowLoadTime);
  }
};

export const navigateToRoot = async (page: Page) => {
  await page.goto(await configs.baseUrl(), { timeout: GOTO_TIMEOUT });
};

export const waitForDashboard = async (page: Page) => {
  return await page.waitForSelector(selectors.DASHBOARD);
};

export const waitForProject = async (page: Page) => {
  return await page.waitForSelector(selectors.PROJECT);
};

export const waitForPreview = async (page: Page) => {
  return await page.waitForSelector(selectors.PREVIEW);
};
