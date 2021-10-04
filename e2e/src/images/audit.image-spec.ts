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

import * as cd from 'cd-interfaces';
import * as consts from 'cd-common/consts';
import { Theme } from 'cd-themes';
import { Page } from 'puppeteer';
import { setupSuite, pause } from '../utils/tests.utils';
import { navigateTo } from '../ui-utils/routes.utils';
import { formatStringWithArguments, toKebabCase } from 'cd-utils/string';
import { getComponents } from 'cd-common/models';
import { OUTLET_FRAME } from '../consts/query-selectors/canvas.consts';
import { takeNewScreenshot, generateLocalFolderWithId } from '../utils/image.utils';
import { registerComponentDefinitions } from 'cd-definitions';

const AUDIT_FILE_PREFIX = 'audit';
const AUDIT_PAGE_URL = '/audit?themeId={0}&componentId={1}';
const FAILED_RESIZE_ERROR =
  'ERROR: Could not resize viewport. Ensure the renderer iframe is running on the same domain. (not w/ live renderer)';
/** Additional padding that gets added after resize to scroll area. */
const IMAGE_RESIZE_PADDING_PX = 10;
/** Pause time to allow components to load finalized state, reducing flakiness. */
const ALLOWED_COMPONENT_LOAD_MS = 1000;

// Register all definitions so we can get a list of them dynamically
registerComponentDefinitions();

const EXCLUDED_COMPONENTS: cd.ComponentIdentity[] = [
  cd.ElementEntitySubType.Board,
  cd.ElementEntitySubType.Symbol,
  cd.ElementEntitySubType.SymbolInstance,
  cd.ElementEntitySubType.Text,
  cd.ElementEntitySubType.Image,
  cd.ElementEntitySubType.Icon,
  cd.ElementEntitySubType.BoardPortal,
  cd.ElementEntitySubType.Generic,
  cd.ElementEntitySubType.IFrame,
  cd.ElementEntitySubType.Media,
];

const THEMES_TO_TEST: Theme[] = [Theme.AngularMaterialDark];

/** Gets a list of all registered component IDs, exclusive of core components. */
const getAuditTestComponents = (): cd.ComponentIdentity[] => {
  const items: cd.ComponentIdentity[] = [];
  const components = getComponents(cd.ComponentLibrary.All, true);
  for (const cmp of components) {
    if (!EXCLUDED_COMPONENTS.includes(cmp.id)) {
      items.push(cmp.id);
    }
  }
  return items;
};

/**
 * Tests each component for each theme on the audit page.
 *  - Run in headless mode
 *  - Run without live renderer
 *
 * This test must be run in headless mode only, since the viewport must be
 * resized to match the scrollable area of the of the audit page, and otherwise
 * the viewport size will max out at the monitor max size.  Also, it currently
 * must be run without the live renderer, since the iframe must be accessed to
 * get the scroll width height.
 */
describe('Audit page image tests', () => {
  let page: Page;
  const themesIds = THEMES_TO_TEST;
  const componentIds = getAuditTestComponents();

  const newTestPageCallback = (p: Page) => {
    page = p;
  };

  setupSuite(newTestPageCallback, beforeAll, afterAll, beforeEach, afterEach, false);

  // Either use the commit sha hash provided by Cloud Build '$COMMIT_SHA' or use the fallback
  const folderId = process.env.npm_config_commitSha || `local-${generateLocalFolderWithId()}`;

  for (const theme of themesIds) {
    for (const id of componentIds) {
      it(`Creating image: ${id} / ${theme}`, async () => {
        // Unique keys to create file name
        const themeKey = toKebabCase(theme);
        const componentKey = toKebabCase(id);
        const keys = [AUDIT_FILE_PREFIX, themeKey, componentKey];

        // Audit page URL with theme/component query params
        const componentId = id.startsWith('cloud-') || id.startsWith('gfab-') ? componentKey : id;
        const auditPageUrl = formatStringWithArguments(AUDIT_PAGE_URL, themeKey, componentId);
        await navigateTo(page, auditPageUrl);

        // Allow the components to load and initial animations to stop
        await pause(ALLOWED_COMPONENT_LOAD_MS);

        // Resize viewport to match scroll width/height
        const succeeded = await resizeViewportToScroll(page);
        // If resize failed, assume iframe is not accessible
        if (!succeeded) throw new Error(FAILED_RESIZE_ERROR);

        // Create image
        await takeNewScreenshot(page, keys, folderId);
      });
    }
  }

  afterAll(() => {
    console.log('Audit page images created');
    const themeCount = themesIds.length;
    const componentCount = componentIds.length;
    console.log(
      `Themes: ${themeCount} | Components: ${componentCount} | Total: ${
        themeCount * componentCount
      }`
    );
  });
});

/** Constant values passed in to the local browser function. */
const ResizeConsts = {
  OUTLET_FRAME: OUTLET_FRAME,
  IFRAME_TAG: consts.IFRAME_TAG,
  RENDERED_ELEMENT_CLASS: consts.RENDERED_ELEMENT_CLASS,
  APP_AUDIT_TAG: 'app-audit',
  TOP_BAR_CLASS: 'top-bar',
} as const;

/** Resizes the viewport based on the internal width/height of the audit scroll view. */
const resizeViewportToScroll = async (page: Page): Promise<boolean> => {
  // Shrink down to lowest to get accurate scroll with/height
  // Note, the values need to be larger than minimum browser width/height
  await page.setViewport({ width: 200, height: 100 });

  // Get top bar height + scroll width/height in browser
  const result: number[] | undefined = await page.evaluate((resizeConsts: typeof ResizeConsts) => {
    // Hide top bar
    const appAudit = document.querySelector(resizeConsts.APP_AUDIT_TAG) as HTMLElement;
    const topBar = document.querySelector(`.${resizeConsts.TOP_BAR_CLASS}`) as HTMLElement;
    appAudit.style.display = 'block';
    topBar.style.display = 'none';

    // Return scroll width/height
    const scrollElement = document
      .querySelector(resizeConsts.OUTLET_FRAME)
      ?.querySelector(resizeConsts.IFRAME_TAG)
      ?.contentDocument?.querySelector(`.${resizeConsts.RENDERED_ELEMENT_CLASS}`);
    if (scrollElement) return [scrollElement.scrollWidth, scrollElement.scrollHeight];
    return undefined;
  }, ResizeConsts);

  // Return false on failure, likely due to cross-origin blocked
  if (!result) return false;

  // Resize puppeteer viewport to match
  await page.setViewport({
    width: result[0] + IMAGE_RESIZE_PADDING_PX,
    height: result[1] + IMAGE_RESIZE_PADDING_PX,
  });

  return true;
};
