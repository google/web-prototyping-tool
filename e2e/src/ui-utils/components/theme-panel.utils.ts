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
import { IHexColor } from '../../models/props.interfaces';
import * as colorPicker from './color-picker.utils';
import * as contextMenu from './context-menu.utils';
import * as selectors from '../../consts/query-selectors/';
import { getElemCenterPoint } from '../common/dom.utils';
import { INTERACTION_INTERVAL } from '../../configs/timing.configs';

export const changeColor = async (page: Page, name: string, color: IHexColor) => {
  const swatchButton = await page.waitForSelector(selectors.THEME_PANEL_COLORS_SWATCH(name));

  await swatchButton.click();
  await page.waitForTimeout(INTERACTION_INTERVAL);
  await colorPicker.setHexAndAlpha(page, color);
};

export const deleteColor = async (page: Page, name: string) => {
  const { x, y } = await getElemCenterPoint(
    await page.waitForSelector(selectors.THEME_PANEL_COLORS_SWATCH(name))
  );

  await page.mouse.move(x, y);
  await page.waitForTimeout(INTERACTION_INTERVAL);

  const menuButtonSelector = selectors.THEME_PANEL_COLORS_MENU_BUTTON(name);
  const menuButton = await page.waitForSelector(menuButtonSelector);

  await menuButton.click();

  await contextMenu.delete_(page);
};
