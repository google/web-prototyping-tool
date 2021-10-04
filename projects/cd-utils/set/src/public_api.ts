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

export const getSetAdditions = (prevSet: Set<any>, newSet: Set<any>): Set<any> => {
  const newSetItems = Array.from(newSet.keys());
  return newSetItems.reduce<Set<any>>((acc, curr) => {
    if (!prevSet.has(curr)) acc.add(curr);
    return acc;
  }, new Set());
};

export const getSetChanges = (
  prevSet: Set<any>,
  newSet: Set<any>,
  subtractions = false
): Set<any> => {
  return subtractions ? getSetAdditions(newSet, prevSet) : getSetAdditions(prevSet, newSet);
};
