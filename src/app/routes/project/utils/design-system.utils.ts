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
import { ROBOTO_FONT as FALLBACK_FONT_ID } from 'cd-themes';
import { isObjectLegacy } from 'cd-utils/object';

const FONT_ID = 'fontId';
const GENERIC_ID = 'id';
// Recursively replace values
const findAndReplaceValueFromId = <T extends cd.IStringMap<any>>(
  prop: any,
  id: string = GENERIC_ID,
  match: string,
  replacement: string | cd.IStringMap<any>,
  modified: boolean = false
): [T, boolean] => {
  if (prop === null || !isObjectLegacy(prop)) return [prop, modified];
  const isReplacementObject = isObjectLegacy(replacement);

  const updates: typeof prop = {};
  const keysToDelete: string[] = [];

  for (const [key, value] of Object.entries(prop)) {
    if (isObjectLegacy(value)) {
      const [item, didChange] = findAndReplaceValueFromId(value, id, match, replacement, modified);
      if (didChange) {
        updates[key] = item;
      }
    } else {
      if (id === key && value === match) {
        if (isReplacementObject) {
          keysToDelete.push(key);
          Object.assign(updates, replacement);
        } else {
          updates[key] = replacement;
        }
      }
    }
  }

  modified = keysToDelete.length !== 0 || Object.keys(updates).length !== 0;

  if (!modified) return [prop, false];

  if (Array.isArray(prop)) prop = [...prop];
  else prop = { ...prop };

  Object.assign(prop, updates);

  for (const key of keysToDelete) {
    delete prop[key];
  }

  return [prop, true];
};

export const replaceFonts = <T extends cd.IStringMap<any>>(obj: T, id: string) =>
  findAndReplaceValueFromId(obj, FONT_ID, id, FALLBACK_FONT_ID);

export const replaceTypography = <T extends cd.IStringMap<any>>(
  obj: T,
  id: string,
  styleClone: cd.ITypographyStyle
) => findAndReplaceValueFromId(obj, GENERIC_ID, id, styleClone);

export const replaceColor = <T extends cd.IStringMap<any>>(
  obj: T,
  id: string,
  styleClone: cd.IValue
) => findAndReplaceValueFromId(obj, GENERIC_ID, id, styleClone);

export const replaceAsset = (obj: any, id: string) =>
  findAndReplaceValueFromId(obj, GENERIC_ID, id, { id: null, value: '' });

export const replaceVariable = <T extends cd.IStringMap<any>>(
  obj: T,
  id: string,
  styleClone: cd.IValue
) => findAndReplaceValueFromId(obj, GENERIC_ID, id, styleClone);
