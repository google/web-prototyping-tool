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

import { launch, Page, Browser, ConsoleMessage, JSHandle } from 'puppeteer';
import * as configs from './configs.utils';
import { LIBRARY_COMPILATION_TIME } from '../configs/timing.configs';
import * as dashboard from '../ui-utils/dashboard.utils';
import * as designSurface from '../ui-utils/design-surface.utils';
import * as routes from '../ui-utils/routes.utils';
import { PREVIEW_IFRAME } from '../consts/query-selectors';

const CIRCULAR_DEP_WARNING = 'Circular dependency detected';
const FIREBASE_ERROR = 'FirebaseError';
const CONSOLE_ERROR_RED = '\x1b[31m';

/** Any console logs with these patterns are ignored, which helps to reduce junk logs. */
const JUNK_LOG_PATTERNS = ['Angular is running in development mode', 'measure - JIT'];

// eslint-disable-next-line require-await
export const serializeConsoleArg = async (arg: JSHandle) =>
  arg.executionContext().evaluate((ctxArg) => {
    let serialized = '';

    const jsonCircularReplacer = () => {
      const seen = new WeakSet();
      return (_key: any, value: any) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return;
          seen.add(value);
        }
        return value;
      };
    };

    const isEasilyStringifiable = typeof ctxArg !== 'object' || ctxArg === null;
    const isErrorLike = ctxArg && ctxArg.message && ctxArg.stack;
    const isAngularDebugContextLike =
      ctxArg &&
      ctxArg.hasOwnProperty &&
      ctxArg.hasOwnProperty('view') &&
      ctxArg.hasOwnProperty('nodeIndex');

    if (isEasilyStringifiable) {
      if (ctxArg === null || ctxArg === undefined) {
        serialized = ctxArg;
      } else if (ctxArg.toString && typeof ctxArg.toString === 'function') {
        serialized = ctxArg.toString();
      } else {
        serialized = '(Something without toString() defined and is not null or undefined)';
      }
    } else if (isErrorLike) {
      serialized = `${ctxArg.stack}\n(Sorry, no sourcemap mapping mechanism for now)`;
    } else if (isAngularDebugContextLike) {
      try {
        const { ns, name, attrs } = ctxArg.view.def.nodes[0].element;
        serialized = `<${ns}${ns ? ':' : ''}${name}> attrs: ${JSON.stringify(attrs)}`;
      } catch (e) {
        serialized = `(Error retrieving ngDebugContext: ${e}`;
      }
    } else {
      serialized = JSON.stringify(ctxArg, jsonCircularReplacer()).substr(0, 300);
    }

    return serialized;
  }, arg);

export const setupErrorReporting = (page: Page) => {
  page.on('error', (e) => console.error('ERROR - Page crahsed:', e));
  page.on('pageerror', (e) => console.error('ERROR - Page unhandled exception:', e));
  page.on('console', async (cm: ConsoleMessage) => {
    const argSerializationPromises = cm.args().map((arg) => serializeConsoleArg(arg));
    const args = await Promise.all(argSerializationPromises);
    const location = JSON.stringify(cm.location());

    // Ignore certain logs
    for (const pattern of JUNK_LOG_PATTERNS) {
      for (const arg of args) {
        if (arg.includes(pattern)) return;
      }
    }

    if (cm.type() !== 'warning') {
      console.log(`Page console.${cm.type()}() at ${location}`, ...args);
    } else {
      if (cm.text().includes(CIRCULAR_DEP_WARNING)) fail(CIRCULAR_DEP_WARNING);
    }

    if (cm.type() === 'error' && !cm.text().includes(FIREBASE_ERROR)) {
      fail(`Failing test due to error in console: ${cm.text()}`);
    }
  });
};

/**
 * This checks the preview pages to ensure each element added has a
 * unique stylesheet associated with it. see cdStyle directive
 */
const checkForDuplicateCDStylesInPreview = async (page: Page) => {
  try {
    const iframe = await page.waitForSelector(PREVIEW_IFRAME, { timeout: 1000 });
    const frame = await iframe.contentFrame();
    if (!frame) return;

    const hasNoDuplicatesStyleClasses = await frame.evaluate(() => {
      const STYLE_PREFIX = 'co___';
      return Array.from(document.querySelectorAll('*'))
        .reduce<string[]>((acc, elem) => acc.concat([...(elem.classList as any)]), [])
        .filter((item) => item.includes(STYLE_PREFIX))
        .every((value, idx, arr) => arr.indexOf(value) === idx);
    });
    await expect(hasNoDuplicatesStyleClasses).toBeTruthy();
  } catch (e) {}
};

export const setupSuite = (
  setPage: (page: Page) => void,
  beforeAll: Function,
  afterAll: Function,
  beforeEach: Function,
  afterEach: Function,
  createNewProject = true
) => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await launch({
      headless: await configs.headless(),
      args: await configs.extraChromeArgs(),
      defaultViewport: await configs.viewport(),
    });

    const context = browser.defaultBrowserContext();
    let baseUrl = await configs.baseUrl();
    if (baseUrl[baseUrl.length - 1] === '/') baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    await context.overridePermissions(baseUrl, ['clipboard-read', 'clipboard-write']);
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    page.setDefaultTimeout(await configs.puppeteerTimeout());
    setupErrorReporting(page);
    setPage(page);

    if (createNewProject) {
      await routes.navigateToRoot(page);

      await routes.waitForDashboard(page);

      await dashboard.clickCreateProjectButton(page);
      await dashboard.clickCreateEmptyTemplate(page);
      await routes.waitForProject(page);

      await page.waitForTimeout(LIBRARY_COMPILATION_TIME);

      await designSurface.waitForIFrame(page, 0);
      await designSurface.waitForGlassBoard(page, 0);
    }
  });

  afterEach(async () => {
    await checkForDuplicateCDStylesInPreview(page);
    await page.close();
  });
};

/** Pause for n milliseconds. */
export const pause = (timeout: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

/** Writes an outlined, red error message to the console. */
export const showHighlightedError = (error: string) => {
  let maxLength = error.length;
  if (error.includes('\n')) {
    const lines = error.split('\n');
    const longest = lines.reduce((a, b) => (a.length > b.length ? a : b));
    maxLength = longest.length;
  }
  const divider = new Array(maxLength).fill('═').join('');
  console.error(CONSOLE_ERROR_RED, `\n${divider}\n${error}\n${divider}\n`);
};
