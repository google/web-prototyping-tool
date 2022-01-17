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
import { areArraysEqual } from 'cd-utils/array';
// Check to see if updates contains changes to any properties that require recompiling

const PROPS_REQUIRING_RECOMPILE: string[] = [];

const updateRequiresRecompile = (update: cd.IPropertiesUpdatePayload): boolean => {
  const { properties } = update;
  const propKeys = Object.keys(properties);
  return propKeys.some((key) => PROPS_REQUIRING_RECOMPILE.includes(key));
};

export const updatesRequireRecompile = (updates: cd.IPropertiesUpdatePayload[]): boolean => {
  return updates.some(updateRequiresRecompile);
};

/**
 * Ensure that we're getting the latest parent value when a child is added
 * This is used by the renderer when using undo / redo
 */
export const buildParentUpdatesFromAddedChildren = (
  payload: cd.PropertyModel[],
  props: cd.ElementPropertiesMap
): cd.ElementPropertiesMap | undefined => {
  const propMap = new Map<string, cd.PropertyModel>();
  const parentIds = new Set<string>();
  for (const item of payload) {
    if (item.parentId) parentIds.add(item.parentId);
    propMap.set(item.id, item);
  }

  let didUpdate = false;
  const update: cd.ElementPropertiesMap = {};
  // We need to determine if the payload element has the same childIds as the existing ones
  for (const id of parentIds) {
    if (!(id in props)) continue;
    const elem = props[id];
    const nextElem = propMap.get(id);
    const currChildIds = elem?.childIds || [];
    const nextChildIds = nextElem?.childIds || [];
    if (areArraysEqual(currChildIds, nextChildIds)) continue;
    update[id] = elem;
    didUpdate = true;
  }

  return didUpdate ? update : undefined;
};
