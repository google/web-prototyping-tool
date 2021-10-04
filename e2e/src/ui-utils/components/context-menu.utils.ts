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
import { EditConfig, BoardConfig } from 'src/app/routes/project/configs/project.config';
import { IConfig } from 'cd-interfaces';
import * as selectors from '../../consts/query-selectors/';

const contextSelector = (config: IConfig): string => selectors.CONTEXT_MENU_ITEM(config?.e2eLabel);

export const clickItem = async (config: IConfig, page: Page) => {
  const selector = contextSelector(config);
  const item = await page.waitForSelector(selector);
  await item.click();
};

export const copy = (page: Page) => clickItem(EditConfig.Copy, page);
export const paste = (page: Page) => clickItem(EditConfig.Paste, page);
export const undo = (page: Page) => clickItem(EditConfig.Undo, page);
export const redo = (page: Page) => clickItem(EditConfig.Redo, page);

export const group = (page: Page) => clickItem(EditConfig.Group, page);

export const createSymbol = (page: Page) => clickItem(EditConfig.CreateSymbol, page);
export const editSymbol = (page: Page) => clickItem(EditConfig.EditSymbol, page);
export const unpackSymbol = (page: Page) => clickItem(EditConfig.UnpackSymbolInstance, page);
export const previewBoard = (page: Page) => clickItem(BoardConfig.Preview, page);

/**
 * Can't name this delete (w/o underscore), as it's a reserved keyword.
 */
export const delete_ = (page: Page) => clickItem(EditConfig.Delete, page);
