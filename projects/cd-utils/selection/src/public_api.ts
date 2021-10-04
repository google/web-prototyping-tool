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

export const selectElement = (elem?: HTMLElement): void => {
  if (!elem) return;
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNode(elem);
  selection.removeAllRanges();
  selection.addRange(range);
};

export const removeAllRanges = (selection?: Selection | null): void => {
  const sel = selection || window.getSelection();
  if (sel) sel.empty();
};

export const selectElementContents = (elem: HTMLElement): void => {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(elem);
  removeAllRanges(selection);
  selection.addRange(range);
};

export const clearSelection = (): void => {
  const selection = window.getSelection();
  if (selection) selection.empty();
};

export const deselectActiveElement = () => {
  if (document.activeElement) (document.activeElement as HTMLElement).blur();
};
