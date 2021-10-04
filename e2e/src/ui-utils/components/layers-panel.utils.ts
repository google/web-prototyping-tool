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

/**
 * Used to click an item from the layers tree.
 *
 * NOTE: The elementIndex is 0-based and true to the layers tree, so if you give the value 0,
 * this will click the root node from the tree (ie. home board or symbol root)
 *
 * @param page: Puppeteer page instance
 * @param elementIndex: Index of element to click
 */
export const getTreeCellElementHandle = async (page: Page, elementIndex: number) => {
  const treeCells = await page.$$('cd-tree-cell');
  if (treeCells.length > 0) return treeCells[elementIndex];
  console.log(`!!!!!!!! COULD NOT SELECT TREE CELL AT INDEX: ${elementIndex} !!!!!!!!`);
  return;
};
