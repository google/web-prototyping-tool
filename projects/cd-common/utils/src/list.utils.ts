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

/**
 * Calculates the new selected Index based on previous and new indicies provided.
 * NOTE: Used with Dynamic and Generic props list components in the properties panel
 *
 * @param previous The previous location of the item
 * @param current The current location of the item
 * @param selected The current selectedIndex for the list
 *
 * TODO: Move this function out of cd-common once we remove generic-props-list component
 */
export const findNewSelectedIndexForListControls = (
  previous: number,
  current: number,
  selected: number
): number => {
  // If selected is previous, that means we have moved the selected item
  if (selected === previous) return current;

  // If both positions are less than or greater than selected, then no need to change selected index
  if ((previous < selected && current < selected) || (previous > selected && current > selected)) {
    return selected;
  }

  return previous < current ? selected - 1 : selected + 1;
};
