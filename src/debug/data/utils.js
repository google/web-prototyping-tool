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

export const isObject = (obj) => !isMap(obj) && !isSet(obj) && typeof obj === 'object';

export const isMap = (item) => item instanceof Map;

export const isSet = (item) => item instanceof Set;

export const isFunction = (item) => typeof item === 'function';

export const areSetsEqual = (a, b) => {
  return a.size === b.size && [...a].every((item) => b.has(item));
};

export const areStringMapsEqual = (a, b) => {
  if (a.size !== b.size) return false;
  for (const [key, value] of a.entries()) {
    const bValue = b.get(key);
    const equal = Array.isArray(value) ? areObjectsEqual(bValue, value) : bValue === value;
    if (!equal) return false;
  }
  return true;
};

export const areMapsEqual = (a, b) => {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    const item = b.get(key);
    if (!item) return false;
    return areObjectsEqual(item, value);
  }
  return true;
};

export const areObjectsEqual = (a, b) => {
  if (a && b) {
    if (isSet(a) && isSet(b)) return areSetsEqual(a, b);
    if (isMap(a) && isMap(b)) return areMapsEqual(a, b);

    if (isObject(a) && isObject(b)) {
      const aKeys = Object.keys(a);
      return (
        aKeys.length === Object.keys(b).length &&
        aKeys.every((key) => areObjectsEqual(a[key], b[key]))
      );
    }
  }

  return a === b;
};
