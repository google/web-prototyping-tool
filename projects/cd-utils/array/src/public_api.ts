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

export const areArraysEqual = (a: ReadonlyArray<any>, b: ReadonlyArray<any>): boolean => {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
};

export const removeValueFromArrayAtIndex = <T>(index: number, arr: T[]): T[] => {
  if (index === -1) return arr;
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
};
