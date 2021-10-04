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

import type { ElementPropertiesMap } from 'cd-interfaces';

interface ISortableItem {
  id: string;
  name: string;
}

/** Sort outlets by name and always make the home board first */
export const sortElementsByName = <T extends ISortableItem>(
  items: T[],
  homeBoardId?: string
): T[] => {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const elements = [...items].sort((a, b) => collator.compare(a.name, b.name));
  const homeIdx = homeBoardId ? elements.findIndex((item) => item.id === homeBoardId) : -1;
  const home = homeIdx !== -1 ? elements.splice(homeIdx, 1) : [];
  return [...home, ...elements];
};

export const sortElementIdsByName = (
  ids: string[],
  elementProps: ElementPropertiesMap
): string[] => {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  return [...ids].sort((a, b) => {
    const aName = elementProps[a]?.name || '';
    const bName = elementProps[b]?.name || '';
    return collator.compare(aName, bName);
  });
};
