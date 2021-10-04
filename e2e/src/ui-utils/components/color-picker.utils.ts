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
import * as selectors from '../../consts/query-selectors/';
import { IHexColor } from '../../models/props.interfaces';
import { KEYS } from '../../utils/cd-utils-keycodes.utils';
import { enterTextInput } from '../common/dom.utils';
import { INTERACTION_INTERVAL } from 'e2e/src/configs/timing.configs';

export const setHexAndAlpha = async (page: Page, { hex, opacityPercentage }: IHexColor) => {
  const hexInput = await page.waitForSelector(selectors.COLOR_PICKER_HEX);
  const alphaInput = await page.waitForSelector(selectors.COLOR_PICKER_ALPHA);

  await enterTextInput(hexInput, hex);
  await page.waitForTimeout(INTERACTION_INTERVAL);

  if (opacityPercentage !== undefined) {
    await enterTextInput(alphaInput, opacityPercentage.toString());
    await page.waitForTimeout(INTERACTION_INTERVAL);
  }

  const picker = await page.waitForSelector(selectors.COLOR_PICKER);
  await picker.focus(); // ensure the picker has focus

  await page.keyboard.press(KEYS.Escape);
  await page.waitForSelector(selectors.COLOR_PICKER, { hidden: true });
};
