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

import type { IRect } from 'cd-interfaces';

export const frameForElement = (element: HTMLElement): IRect => {
  const { top, left, width, height } = element.getBoundingClientRect();
  return { x: left, y: top, width, height };
};

/** Given an event get the index of the closest child selector */
export const closestChildIndexForEvent = (
  e: MouseEvent | KeyboardEvent,
  selector: string
): number => {
  const container = e.currentTarget as HTMLElement;
  const target = (e.target as HTMLElement).closest(selector);
  if (!target) return -1;
  return Array.from(container.children).indexOf(target);
};
