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
import { createElementChangePayload } from 'cd-common/utils';
import { getAllChildIdsRecursive, getModels } from './properties.utils';
import { simpleClone } from 'cd-utils/object';
import { generateNIndexesBetween } from 'cd-utils/fractional-index';

export const DROP_GUTTER_WIDTH = 10; // For smaller items should this be a percentage?
export const LAYERS_NODE_DROP_GUTTER_WIDTH = 8;

/**
 * Instead of cloning the entire properties model
 * only clone the contents of affected boards
 */
const getTargetProperties = (
  elementProperties: cd.ElementPropertiesMap,
  ids: string[]
): cd.ElementPropertiesMap => {
  const models = getModels(elementProperties);
  const props: cd.ElementPropertiesMap = {};
  for (const id of ids) {
    const element = elementProperties[id];
    if (!element) continue;
    const rootId = element.rootId;
    if (rootId in props) continue;
    const rootChildren = models.filter((child) => child.rootId === rootId);
    for (const child of rootChildren) {
      props[child.id] = child;
    }
  }
  return simpleClone(props);
};

export const insertElements = (
  // These ids can be existing ids contained in the ElementPropertiesMap or they can be ids of items
  // in the array of newElements.
  // The ids should be for the items that are at the root of the subtree being inserted
  insertIds: string[],
  insertLocation: cd.IInsertLocation,
  elementProps: cd.ElementPropertiesMap,
  newElements: cd.PropertyModel[] = [],
  showPreviewStyles = false
): cd.IElementChangePayload => {
  const insertionChange = createElementChangePayload();
  const sets: cd.PropertyModel[] = [];
  const updates: cd.IUpdateChange<cd.PropertyModel>[] = [];
  const { elementId: insertTargetId, relation } = insertLocation;

  // Create a clone of the currentProperties but exclude roots we're not using
  const mergedProps = getTargetProperties(elementProps, [insertTargetId, ...insertIds]);

  // inserting new elements into the properties map so we can look up them up below
  // (e.g. a new board being created that is also the insert target)
  for (const element of newElements) {
    mergedProps[element.id] = element;
  }

  // Find insert location element
  const insertTarget = mergedProps[insertTargetId];
  if (!insertTarget) return insertionChange;

  // Find new parent for inserted elements
  const parent = getInsertParent(relation, insertTarget, mergedProps);
  if (!parent) return insertionChange;

  const { childIds, id: parentId } = parent;
  const elementIndex = childIds.findIndex((id) => id === insertTargetId);
  const { Before, After, Prepend, Append } = cd.InsertRelation;
  let beforeFidx: string | null = null;
  let afterFidx: string | null = null;

  // For prepend, insert before first child (if it exists)
  if (relation === Prepend) {
    const beforeChild = childIds.length ? mergedProps[childIds[0]] : undefined;
    beforeFidx = beforeChild?.fractionalIndex || null;
  }
  // For append, insert after last child (if it exists)
  else if (relation === Append) {
    const afterChild = childIds.length ? mergedProps[childIds[childIds.length - 1]] : undefined;
    afterFidx = afterChild?.fractionalIndex || null;
  }
  // For before elementId, use insertElement as before index
  // and use preceding element as after index
  else if (relation === Before) {
    beforeFidx = insertTarget.fractionalIndex || null;
    const afterChild = childIds.length ? mergedProps[childIds[elementIndex - 1]] : undefined;
    afterFidx = afterChild?.fractionalIndex || null;
  }
  // For after elementId, use insertElement as after index
  // and use next element as before index
  else if (relation === After) {
    const beforeChild = childIds.length ? mergedProps[childIds[elementIndex + 1]] : undefined;
    beforeFidx = beforeChild?.fractionalIndex || null;
    afterFidx = insertTarget?.fractionalIndex || null;
  }

  // Generate updates and sets for change payload
  const newElementIds = new Set(newElements.map((e) => e.id));
  const { rootId } = parent;
  const insertIndexes = generateNIndexesBetween(afterFidx, beforeFidx, insertIds.length);
  const inserted: cd.PropertyModel[] = [];
  const insertedIds = new Set<string>();

  for (let i = 0; i < insertIds.length; i++) {
    const id = insertIds[i];
    const fractionalIndex = insertIndexes[i];
    const element = mergedProps[id];
    insertedIds.add(id);

    if (!element) {
      console.warn('Attempted to move an element that does not exist');
      continue;
    }

    const update = { rootId, parentId, fractionalIndex, showPreviewStyles };
    const updatedElement = { ...element, ...update };
    inserted.push(updatedElement);

    // Either push a set or an update depending if this a newly created element or not
    if (newElementIds.has(id)) sets.push(updatedElement);
    else updates.push({ id, update });
  }

  // Create sets ands updates for all the children of the insertIds
  // A set is generated if the child is a new element
  // An update is generated if the child already exists
  const allChildIds = inserted.flatMap((e) => getAllChildIdsRecursive(e.id, mergedProps, false));
  for (const id of allChildIds) {
    const el = mergedProps[id];
    insertedIds.add(id);
    if (!el) continue;

    const update = { rootId };
    if (newElementIds.has(id)) sets.push({ ...el, ...update });
    else updates.push({ id, update });
  }

  // We need to add a set operation for each new element that is not listed in insertIds or is a
  // child of an inserted element. This can occur if a new board is created as part of this insert
  for (const element of newElements) {
    if (insertedIds.has(element.id)) continue;
    sets.push(element);
  }

  insertionChange.sets = sets;
  insertionChange.updates = updates;
  return insertionChange;
};

// Utility to determine new parent based on relation + target
const getInsertParent = (
  relation: cd.InsertRelation,
  target: cd.PropertyModel,
  elementProperties: cd.ElementPropertiesMap
): cd.PropertyModel | undefined => {
  const { parentId } = target;
  if (relation === cd.InsertRelation.Append || relation === cd.InsertRelation.Prepend) {
    return target;
  }
  // else for Before / After, we are dropping in parent of target
  return parentId ? elementProperties[parentId] : undefined;
};
