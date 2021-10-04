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

import type * as cd from 'cd-interfaces';
import { isObject } from 'cd-utils/object';
import { lookupObjectValueWithKeysWithinObject } from './dataset.utils';

// Don't attempt to flatten merge any properties that are Firestore Timestamps
export const NO_EXPAND_PROP_LIST = new Set([
  'changeMarker',
  'updatedAt',
  'createdAt',
  'lastScreenshotTime',
]);

export const DOT_NOTATION_SEPARATOR = '.';

export const generatePropertyKey = (
  key: string,
  parentKey?: string,
  separator = DOT_NOTATION_SEPARATOR
): string => {
  return parentKey ? `${parentKey}${separator}${key}` : key;
};

/**
 * Convert any nested objects in an update to dot notation which is required by the firestore API
 * to update nests values:
 * https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#data:-updatedata
 *
 * For example:
 *
 * An update for { changeMarker: { id: '1', timestamp: 1234 }}
 *
 * becomes:
 *
 * {
 *  'changeMarker.id': 1
 *  'changeMarker.timestamp': 1234
 * }
 */
export const flattenObjectWithDotNotation = (obj: any, parentKey = ''): cd.IStringMap<any> => {
  let dotNotationObject: cd.IStringMap<any> = {};
  const entries = Object.entries(obj || {});
  for (let i = 0; i < entries.length; i++) {
    const item = entries[i];
    const [nodeKey, value] = item;
    if (value === undefined) continue;
    const isObjectType = isObject(value) && !Array.isArray(value);
    const valueIsEmptyObject = isObjectType && Object.keys(value as Object).length === 0;
    const key = generatePropertyKey(nodeKey, parentKey);

    if (isObjectType && !valueIsEmptyObject && !NO_EXPAND_PROP_LIST.has(key)) {
      const children = flattenObjectWithDotNotation(value, key);
      dotNotationObject = { ...dotNotationObject, ...children };
    } else if (valueIsEmptyObject) {
      // assign a new empty object to prevent any mutations (which will throw an error)
      dotNotationObject[key] = {};
    } else {
      dotNotationObject[key] = value;
    }
  }

  return dotNotationObject;
};

/**
 * Construct a regex that matches any key that starts with any of the null keys
 * For example, a null key of 'foo' should match 'foo.bar'
 *
 * Returns undefined if there are no null keys found
 */
const constructNullKeyRegex = (obj: cd.IStringMap<any>): RegExp | undefined => {
  // Find all keys that have null values
  const nullKeys = Object.entries(obj).reduce<string[]>((acc, curr) => {
    const [key, val] = curr;
    if (val !== null) return acc;
    acc.push(key);
    return acc;
  }, []);

  if (!nullKeys.length) return undefined;

  // Construct a regex that matches any keys that should be removed
  const escapedKeys = nullKeys.map((k) => k.replace(/\./g, '.')); // escape all periods
  const regExStr = escapedKeys.map((k) => `(${k})`).join('|');
  return new RegExp(`^${regExStr}`);
};

/**
 * Given an object that has been flattened using dot notation, convert it back to a nested
 * structure.
 *
 * For example: { 'color: 'red', 'location.parentId': 1234}
 *
 * becomes: {
 *  color: 'red',
 *  location: {
 *    parentId: 1234
 *  }
 * }
 */
export const expandObjectDotNotation = (
  obj: cd.IStringMap<any>,
  filterOutNullValues = true
): any => {
  const nullKeyRegex = filterOutNullValues ? constructNullKeyRegex(obj) : undefined;

  return Object.entries(obj).reduce((acc, curr) => {
    const [key, value] = curr;
    const keyParts = key.split(DOT_NOTATION_SEPARATOR);
    const lastPart = keyParts.pop() as string;
    let partParent = acc;

    // create an object for each nested key part
    for (let i = 0; i < keyParts.length; i++) {
      // only construct a parent object if the path to it has not been nullified
      const part = keyParts[i];
      const pathToPart = keyParts.slice(0, i + 1).join(DOT_NOTATION_SEPARATOR);
      if (nullKeyRegex?.test(pathToPart)) return acc;

      if (!isObject(partParent[part])) partParent[part] = {};

      // recursively assign partParent down to correct location
      partParent = partParent[part];
    }

    // assign actual value to last key part (e.g. foo['bar'] = value)
    if (filterOutNullValues && value === null) return acc;
    if (!partParent[lastPart]) partParent[lastPart] = value; // don't override existing value
    return acc;
  }, {} as cd.IStringMap<any>);
};

export const mergeWithDotNotation = <T extends cd.IStringMap<any>>(
  objectA: T,
  objectB: cd.RecursivePartial<T>
): T => {
  const dotNotationA = flattenObjectWithDotNotation(objectA);
  const dotNotationB = flattenObjectWithDotNotation(objectB);
  let merge = { ...dotNotationA, ...dotNotationB };
  const expand = expandObjectDotNotation(merge) as T;
  return expand;
};

/**
 * Given an array of dot notation keys, return an object that contains all of their corresponding
 * values within the object.
 *
 * For example:
 * keys: ['color', 'location.parentId']
 *
 * would return: { 'color': 'red', 'location.parentId': 1234 }
 */
export const lookupDotNotationKeysInObject = (keys: string[], obj: any): cd.IStringMap<any> => {
  return keys.reduce<cd.IStringMap<any>>((acc, currKey) => {
    const keyParts = currKey.split(DOT_NOTATION_SEPARATOR);
    const value = lookupObjectValueWithKeysWithinObject(obj, keyParts);
    acc[currKey] = value;
    return acc;
  }, {});
};
