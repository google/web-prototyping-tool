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

import { isNumber } from 'cd-utils/numeric';
import { isString } from 'cd-utils/string';

const enum DataType {
  Object = 'object',
  Function = 'function',
  Boolean = 'boolean',
}

export const isMap = (item: any): item is Map<string, any> => item instanceof Map;

export const isSet = (item: any): item is Set<string> => item instanceof Set;

export const isFunction = (item: any): boolean => typeof item === DataType.Function;

export const isObject = (obj: any): boolean => {
  return obj !== null && typeof obj === DataType.Object && !isMap(obj) && !isSet(obj);
};

export const isEmptyObject = (obj: any): boolean => {
  return isObject(obj) && Object.keys(obj).length === 0;
};

/**
 * @deprecated
 * Checks if a value is an object, however a null value will return true
 * */
export const isObjectLegacy = (obj: any): boolean => {
  return typeof obj === DataType.Object && !isMap(obj) && !isSet(obj);
};

export const areSetsEqual = (a: ReadonlySet<any>, b: ReadonlySet<any>): boolean => {
  return a.size === b.size && [...a].every((item) => b.has(item));
};

export const isBoolean = (value: any): value is boolean => {
  return typeof value === DataType.Boolean || value instanceof Boolean;
};

export const isUndefined = (value: any): value is undefined => {
  return value === undefined;
};

export const isNull = (value: any): value is null => {
  return value === null;
};

/** check that a value is not null or undefined */
export const isDefined = <T>(value: T | undefined | null): value is T => {
  return !isUndefined(value) && !isNull(value);
};

/** Currently not taking into account Symbol or bigint */
export const isPrimitive = (item: any): boolean => {
  return item === null || item === undefined || isString(item) || isBoolean(item) || isNumber(item);
};

/**
 * Checks to see if the item can be iterator over
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
 */
export const isIterable = (item: any): boolean => {
  if (item === null || item === undefined) return false;
  return isFunction(item[Symbol.iterator]);
};

export const areStringMapsEqual = (
  a: ReadonlyMap<string, string | string[]>,
  b: ReadonlyMap<string, string | string[]>
): boolean => {
  if (a.size !== b.size) return false;
  for (const [key, value] of a.entries()) {
    const bValue = b.get(key);
    const equal = Array.isArray(value) ? areObjectsEqual(bValue, value) : bValue === value;
    if (!equal) return false;
  }
  return true;
};

export const areMapsEqual = (a: ReadonlyMap<string, any>, b: ReadonlyMap<string, any>): boolean => {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    const item = b.get(key);
    if (!item) return false;
    return areObjectsEqual(item, value);
  }
  return true;
};

export const areObjectsEqual = (a: any, b: any): boolean => {
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

export const isObjectEmpty = (...objs: any[]): boolean => {
  return objs.every((obj) => Object.keys(obj).length === 0 && obj.constructor === Object);
};

export const simpleClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// TODO: This limited-purpose function is intended to deep-copy PropertyModel only ---
// (There is no cycle detection either, accordingly.)
// TODO: Do a formal benchmark on best implementation
export const deepCopy = <T>(obj: T): T => {
  if (obj === null || !isObject(obj)) return obj;

  if (Array.isArray(obj)) {
    const ret = obj.map((value) => deepCopy(value));
    return ret as unknown as T;
  }

  return Object.entries(obj).reduce((acc: any, [key, value]) => {
    acc[key] = deepCopy(value);
    return acc;
  }, {} as T);
};

export const classToObject = <T>(cl: T) => {
  return Object.entries(cl).reduce((acc: any, currentEntry) => {
    const [key, value] = currentEntry;
    if (!isFunction(value)) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/** Returns a new object which no longer contains any keys of a given set */
export const filterOutKeysFromObject = (
  obj: { [key: string]: any },
  keysToRemove: Set<string>
): { [key: string]: any } => {
  const entries = Object.entries(obj);
  const filteredEntries = entries.filter(([key]) => !keysToRemove.has(key));
  return Object.fromEntries(filteredEntries);
};
