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
import { setupSuite } from '../utils/tests.utils';
import { launchPreview } from '../ui-utils/design-surface.utils';
import {
  isCreateMode,
  startImageLogger,
  endImageLogger,
  takeNewScreenshot,
  compareScreenshotWithBaseline,
} from '../utils/image.utils';

const APP_PREFIX = 'app';
const APP_THEME = 'light';

describe('App image tests', () => {
  let page: Page;

  const newTestPageCallback = (p: Page) => {
    page = p;
  };

  setupSuite(newTestPageCallback, beforeAll, afterAll, beforeEach, afterEach);

  beforeAll(() => startImageLogger('App Pages'));

  it(`${isCreateMode ? 'Creating' : 'Testing'} image for project`, async () => {
    const keys = [APP_PREFIX, APP_THEME, 'project'];

    // Create baseline image
    if (isCreateMode) {
      await takeNewScreenshot(page, keys);
    }

    // Test screenshot against baseline image
    else {
      const result = await compareScreenshotWithBaseline(page, keys);
      expect(result.success).toBe(true);
    }
  });

  it(`${isCreateMode ? 'Creating' : 'Testing'} image for preview`, async () => {
    const keys = [APP_PREFIX, APP_THEME, 'preview'];
    await launchPreview(page, 0);

    // Create baseline image
    if (isCreateMode) {
      await takeNewScreenshot(page, keys);
    }

    // Test screenshot against baseline image
    else {
      const result = await compareScreenshotWithBaseline(page, keys);
      expect(result.success).toBe(true);
    }
  });

  afterAll(() => endImageLogger());
});
