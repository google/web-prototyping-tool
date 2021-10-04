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

import * as cd from 'cd-interfaces';
import { isPrimitive, isObject } from 'cd-utils/object';

/** Fields ignored for value comparison. */
const IGNORE_FIELDS = ['updatedAt', 'lastScreenshotTime'];

export interface IDataComparison {
  isSynchronised: boolean;
  errors: string[];
}

/**
 * Checks data synchronization between 2 project states.
 * - Checks equality for primitive values
 * - Recursively checks objects
 * - Checks primitive arrays for equality
 * - Checks arrays of docs recursively for each doc
 * - Ignores equality of empty values, null, undefined, empty arrays
 * - Checks for mismatched types
 */
export const compareData = (
  remoteObj: cd.IStringMap<any>,
  localObj: cd.IStringMap<any>
): IDataComparison => {
  const comparison = { isSynchronised: true, errors: [] };
  compareObjects(remoteObj, localObj, '', comparison);
  comparison.isSynchronised = comparison.errors.length === 0;
  return comparison;
};

/** Compares 2 objects for synchronicity. */
const compareObjects = (
  remoteObj: any,
  localObj: any,
  prefix: string,
  comparison: IDataComparison
): IDataComparison => {
  // Check for key mismatch on both objects
  const emptyKeys = checkEmptyValues(remoteObj, localObj, prefix, comparison);

  // Compare each value
  for (const [key, remoteValue] of Object.entries(remoteObj)) {
    if (IGNORE_FIELDS.includes(key) || emptyKeys.includes(key)) continue;
    const localValue = (localObj as cd.IStringMap<any>)[key];

    if (!isNullOrUndefined(remoteValue) && !isNullOrUndefined(localValue)) {
      const prefixedKey = addKeyPrefix(prefix, key);

      // Primitive
      if (isPrimitive(remoteValue) && isPrimitive(localValue)) {
        if (remoteValue !== localValue) {
          comparison.errors.push(
            `"${prefixedKey}" value mismatch. Remote: ${remoteValue}, Local: ${localValue}`
          );
        }
      }

      // Object, recursively check
      else if (isPlainObject(localValue) && isPlainObject(remoteValue)) {
        compareObjects(remoteValue, localValue, prefixedKey, comparison);
      }

      // Arrays
      else if (Array.isArray(remoteValue) && Array.isArray(localValue)) {
        compareArray(remoteValue, localValue, prefixedKey as string, comparison);
      }

      // Type mismatch
      // Note: This may be allowed in some cases
      else if (!isEmptyValue(remoteValue) && !isEmptyValue(localValue)) {
        comparison.errors.push(
          `"${prefixedKey}" type mismatch. Remote: ${remoteValue}, Local: ${localValue}`
        );
      }
    }
  }

  return comparison;
};

/** Compares 2 arrays for synchronicity. */
const compareArray = (
  remoteArray: any,
  localArray: any,
  prefix: string,
  comparison: IDataComparison
) => {
  if (!remoteArray.length && !localArray.length) return;

  // Array of documents
  if (isDocArray(remoteArray) || isDocArray(localArray)) {
    const distinctIds = [
      ...new Set([...remoteArray.map((o: any) => o.id), ...localArray.map((o: any) => o.id)]),
    ];
    for (const id of distinctIds) {
      const remoteDoc = remoteArray.find((o: any) => o.id === id);
      const localDoc = localArray.find((o: any) => o.id === id);
      if (!remoteDoc) {
        comparison.errors.push(`"${prefix}" missing remote document with id: ${id}`);
      } else if (!localDoc) {
        comparison.errors.push(`"${prefix}" missing local document with id: ${id}`);
      } else {
        const docPrefix = `${prefix}[{id: ${id}}]`;
        compareObjects(remoteDoc, localDoc, docPrefix, comparison);
      }
    }
  }

  // Other array type
  else {
    // Compare the arrays by creating a string key for each
    // Note: this could possibly with simple objects, as they cannot be sorted
    const remoteKey = remoteArray.sort().toString();
    const localKey = localArray.sort().toString();
    if (remoteKey !== localKey) {
      comparison.errors.push(
        `"${prefix}" array mismatch. Remote: [${remoteKey}], Local: [${localKey}]`
      );
    }
  }
};

/** Checks for when remote or local properties have empty values, but the other does not. */
const checkEmptyValues = (
  remoteObj: any,
  localObj: any,
  prefix: string,
  comparison: IDataComparison
): string[] => {
  const emptyKeys = [];
  const allKeys = [...new Set([...Object.keys(remoteObj), ...Object.keys(localObj)])];

  // Check when
  for (const key of allKeys) {
    const remoteValue = remoteObj[key];
    const localValue = localObj[key];
    const isRemoteEmpty = isEmptyValue(remoteValue);
    const isLocalEmpty = isEmptyValue(localValue);
    // Considered out of sync if only one side helps an empty value (null/undefined/[])
    // Unless, both objects are arrays, since arrays are checked later in sequence.
    if (
      (isLocalEmpty || isRemoteEmpty) &&
      !(isLocalEmpty && isRemoteEmpty) &&
      !(Array.isArray(remoteValue) && Array.isArray(localValue))
    ) {
      comparison.errors.push(
        `"${addKeyPrefix(prefix, key)}" missing ${
          isRemoteEmpty ? 'remote' : 'local'
        } value, Remote: ${printEmpty(remoteValue)}, Local: ${printEmpty(localValue)}`
      );
      emptyKeys.push(key);
    }
  }

  return emptyKeys;
};

/** Returns true if array items objects with an id. */
const isDocArray = (array: any[]): boolean => {
  return !array.length || array.every((o) => isObject(o) && !!o.id);
};

/** Adds a prefix to a key if it exists. */
const addKeyPrefix = (prefix: string, key: string): string => (prefix ? `${prefix}.${key}` : key);

const isNullOrUndefined = (value: any): boolean => value === null || value === undefined;

const isPlainObject = (value: any): boolean => !Array.isArray(value) && isObject(value);

const isEmptyArray = (array: any[]): boolean => Array.isArray(array) && !array.length;

/** Is null, undefined, or [] */
const isEmptyValue = (value: any): boolean => isNullOrUndefined(value) || isEmptyArray(value);

const printEmpty = (value: any): string => (isEmptyArray(value) ? '[]' : `${value}`);
