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
import { DEFAULT_PRIMITIVE_STYLES, DEFAULT_PRIMITIVE_STYLE_PROPS } from './consts/styles.consts';
import { IElementPosition } from './models/elements.interface';
import { setupSuite } from './utils/tests.utils';
import { selectAndViewBoard, clickElement } from './ui-utils/components/canvas.utils';
import {
  dragElementFromComponentToBoard,
  waitForGlassElement,
  getElementStyles,
  waitForIFrame,
  waitForGlassBoard,
  dragIconFromComponentToBoard,
} from './ui-utils/design-surface.utils';
import { elemPos } from './utils/elements';
import { INTERACTION_INTERVAL } from './configs/timing.configs';
import { CD_PROPERTIES } from './consts/query-selectors/properties-panel.consts';

describe('Basic flow', () => {
  let page: Page;

  const newTestPageCallback = (p: Page) => {
    page = p;
  };

  setupSuite(newTestPageCallback, beforeAll, afterAll, beforeEach, afterEach);

  it("(Experimental: New project's metrics)", async () => {
    // Force garbage collection first
    const client = await (page as any)._client;
    if (!client) return;
    await client.send('HeapProfiler.enable');
    await client.send('HeapProfiler.collectGarbage');
    const metrics = await page.metrics();
    const { Nodes, JSEventListeners, JSHeapUsedSize } = metrics;
    const outputMetric = { Nodes, JSEventListeners, JSHeapUsedSize };
    console.log(`##E2E_EXPERMENTAL_PAGE_PERF_METRICS## ${JSON.stringify(outputMetric)}`);
  });

  it('should create a project with a board', async () => {
    const iframe = await waitForIFrame(page, 0);
    const glassBoard = await waitForGlassBoard(page, 0);
    expect(iframe).not.toBeNull('could not find the board iframe');
    expect(glassBoard).not.toBeNull('could not find the board glass elem');
  });

  it('should create new project and drag elements to board with default style', async () => {
    const position: IElementPosition = elemPos(0, [0]);

    await selectAndViewBoard(page, 0);
    await dragElementFromComponentToBoard(page, 0);
    await waitForGlassElement(page, position);

    await page.waitForTimeout(INTERACTION_INTERVAL);

    const renderedStyles = await getElementStyles(page, position, DEFAULT_PRIMITIVE_STYLE_PROPS);

    expect(renderedStyles).toEqual(DEFAULT_PRIMITIVE_STYLES, 'mismatching default element styles');
  });

  it('should not show properties panel when multi-selecting different types of elements', async () => {
    const elemPosition: IElementPosition = elemPos(0, [0]);
    const iconPosition: IElementPosition = elemPos(0, [1]);

    await selectAndViewBoard(page, 0);

    // add generic element
    await dragElementFromComponentToBoard(page, 0);
    await waitForGlassElement(page, elemPosition);

    // add icon element
    await dragIconFromComponentToBoard(page, 0);
    await waitForGlassElement(page, iconPosition);

    // click generic element
    await clickElement(page, elemPosition);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    // shift + click icon element
    await clickElement(page, iconPosition, true);
    await page.waitForTimeout(INTERACTION_INTERVAL);

    // check that properties panel is empty
    // i.e. check that `cd-properties` tag does not exist
    const cdProperties = await page.$(CD_PROPERTIES);

    expect(cdProperties).toEqual(null, 'cd-properties should not exist');
  });
});
