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

import puppeteer from 'puppeteer';
import { log, logError } from './log';
import * as consts from 'cd-common/consts';

// Array of console errors that can be ignored
const IGNORED_ERRORS = [
  'JSHandle@error',
  'Missing or insufficient permissions',
  'Not allowed to load local resource: blob',
];

const PREVIEW_PAGE_IFRAME_SELECTOR = 'app-render-outlet-iframe iframe';
const PAGE_RENDER_WAIT_TIME = 3000;
const SCREENSHOT_TIMEOUT_SECONDS = 75;
const SCREENSHOT_TIMEOUT = SCREENSHOT_TIMEOUT_SECONDS * 1000;
const PUPPETEER_CONFIG = { args: ['--no-sandbox', '--headless', '--disable-dev-shm-usage'] };
const ON_RENDER_RESULTS = 'onRenderResults';
const VIEWPORT_CONFIG = { width: 7680, height: 4320 };
const SCREENSHOT_TIMEOUT_ERROR = 'Generating screenshot timed out.';

const timeoutPromise = () =>
  new Promise<string>((_resolve, reject) => {
    setTimeout(() => {
      reject(SCREENSHOT_TIMEOUT_ERROR);
    }, SCREENSHOT_TIMEOUT);
  });

const screenshotPromise = (url: string, page: puppeteer.Page): Promise<string> =>
  new Promise<string>(async (resolve, reject) => {
    page.on('error', (e: Error) => reject(`ERROR - Page crashed: ${e}`));
    page.on('pageerror', (e: Error) => reject(`ERROR - Page unhandled exception: ${e}`));

    // Disabling for now. See following issue:
    // https://github.com/GoogleChrome/puppeteer/issues/3397#issuecomment-429325514
    // TODO: enable aborting screenshot task on errors in console
    page.on('console', (msg) => {
      // Error & PageError may not get capture, but console does
      if (msg.type() === 'error') {
        const txt = msg.text();
        const ignoreError = IGNORED_ERRORS.some((e) => txt.includes(e));
        if (!ignoreError) {
          reject(`Error in console - ${txt}`);
        }
      }
    });

    await page.exposeFunction(ON_RENDER_RESULTS, async () => {
      log(ON_RENDER_RESULTS);

      try {
        await page.waitForTimeout(PAGE_RENDER_WAIT_TIME);

        const iframeElement = await page.$(PREVIEW_PAGE_IFRAME_SELECTOR);
        if (!iframeElement) return reject('Failed to get iframeElement');

        const clip = await iframeElement.boundingBox();
        if (!clip) return reject('Failed to get clip for iframe');
        // Allow for transparent symbol capture
        await page.evaluate(() =>
          document.documentElement.style.setProperty(`--cd-background-color`, 'transparent')
        );

        await page.screenshot({
          path: consts.ORIGINAL_SCREENSHOT_APP_ENGINE_LOCATION,
          omitBackground: true,
          clip,
        });
        return resolve(consts.ORIGINAL_SCREENSHOT_APP_ENGINE_LOCATION);
      } catch (err) {
        reject(err);
      }
    });

    // listen for events of type 'message' (i.e. post messages)
    await page.evaluateOnNewDocument(() => {
      const win = window as any;
      const RENDER_RESULTS_MESSAGE = 'Preview Render Results';
      const MESSAGE_SANDBOX_CODE_COMPONENTS_LOADED = 'Code components loaded';
      const MESSAGE_SANDBOX_CODE_COMPONENT_PREVIEW_READY = 'Code component preview ready';
      const CODE_COMPONENTS_TIMEOUT_SECONDS = 30;
      const CODE_COMPONENTS_TIMEOUT = CODE_COMPONENTS_TIMEOUT_SECONDS * 1000;

      /**
       * In a normal preview page frame, we wait for both render results and code components
       * to be loaded.
       *
       * In a code component preview frame there are no render results, so we only wait for
       * "Code component preview ready" message
       */
      let renderResults = false;
      let codeComponentsLoaded = false;
      let codeComponentPreviewReady = false;

      const proceedIfReady = () => {
        const previewReady = renderResults && codeComponentsLoaded;
        if (!previewReady && !codeComponentPreviewReady) return;
        win.removeEventListener('message', win.onPostMessage);
        win.clearTimeout(codeComponentsTimeout);
        win.onRenderResults();
      };

      // Don't wait indefinitely for code componnets to load, if the user entered an invalid
      // tagname for their code component, it will never be defined on the page. Wait for timeout
      // and then go ahead and take screenshot if we have render results
      const codeComponentsTimeout = win.setTimeout(() => {
        codeComponentsLoaded = true;
        proceedIfReady();
      }, CODE_COMPONENTS_TIMEOUT);

      // call onRenderResults handler exposed above when both render resutlts and code components
      // have loaded
      win.onPostMessage = ({ data }: MessageEvent) => {
        const { appMessage, name } = data;
        if (!appMessage) return;

        // got render results message
        if (name === RENDER_RESULTS_MESSAGE) {
          renderResults = true;
          proceedIfReady();
        }

        // got code components loaded message
        if (name === MESSAGE_SANDBOX_CODE_COMPONENTS_LOADED) {
          codeComponentsLoaded = true;
          proceedIfReady();
        }

        // got code components prevew ready  message
        if (name === MESSAGE_SANDBOX_CODE_COMPONENT_PREVIEW_READY) {
          codeComponentPreviewReady = true;
          proceedIfReady();
        }
      };
      win.addEventListener('message', win.onPostMessage);
    });

    log('Going to url: ', url);
    await page.goto(url, { timeout: SCREENSHOT_TIMEOUT });
  });

/**
 * Utility to use puppeteer to take a screenshot of a given url
 * Returns a string of the path to the generated screenshot
 * or undefined if screenshot generation failed
 * @param url
 */
export const takeScreenshot = async (url: string): Promise<string> => {
  const browser = await puppeteer.launch(PUPPETEER_CONFIG);
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT_CONFIG);

  return Promise.race([screenshotPromise(url, page), timeoutPromise()]).finally(async () => {
    page.removeAllListeners('console');
    page.removeAllListeners('error');
    page.removeAllListeners('pageerror');
    try {
      await page.close();
      await browser.close();
      log('Finished screenshot');
    } catch (e) {
      logError('Failed to close browser and/or page', e);
    }
  });
};
