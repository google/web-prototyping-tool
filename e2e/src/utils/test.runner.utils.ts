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
import { setupSuite } from './tests.utils';
import { INTERACTION_INTERVAL } from '../configs/timing.configs';
import { ITest, ITestBehavior, ITestExpectations, BehaviorType } from '../consts/tests.interface';

const getFilteredTests = (tests: ITest[]) =>
  tests.some((test) => test.run) ? tests.filter((test) => test.run) : tests;

type behaviorReducer = (test: ITestBehavior, page: Page) => Promise<void> | undefined;
type behaviorValidator = (
  expected: ITestExpectations | undefined,
  page: Page
) => Promise<void> | undefined;

export const testRunner = (
  tests: ITest[],
  reducer: behaviorReducer,
  validator: behaviorValidator
) => {
  let page: Page;
  const newTestPageCallback = (p: Page) => (page = p);

  setupSuite(newTestPageCallback, beforeAll, afterAll, beforeEach, afterEach);

  const filteredTests = getFilteredTests(tests);

  for (const test of filteredTests) {
    it(test.title, async () => {
      const len = test.do.length;
      for (let i = 0; i < len; i++) {
        const item = test.do[i];
        console.log(`👉 ${i + 1}/${len} ${test.title} : ${BehaviorType[item.type]}`);
        await reducer(item, page);
        const waitTime = item.wait || INTERACTION_INTERVAL;
        await page.waitForTimeout(waitTime);
      }

      await validator(test.expected, page);
    });
  }
};
