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
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { deepMerge } from 'cd-common/utils';
import { getModels } from './properties.utils';
import { simpleClone } from 'cd-utils/object';

export const DROP_GUTTER_WIDTH = 10; // For smaller items should this be a percentage?
export const LAYERS_NODE_DROP_GUTTER_WIDTH = 8;

export const removePreviewStyles = (updates: cd.IPropertiesUpdatePayload[]) => {
  return updates.map(({ elementId, properties: props }) => {
    const { showPreviewStyles, ...properties } = props;
    return { elementId, properties };
  });
};

const findAllSimilarProperties = (
  id: string,
  values: cd.IPropertiesUpdatePayload[]
): cd.IPropertiesUpdatePayload[] => {
  return values.reduce<cd.IPropertiesUpdatePayload[]>((acc, item) => {
    if (item.elementId === id) acc.push(item);
    return acc;
  }, []);
};

const mergeProps = (values: cd.IPropertiesUpdatePayload[]): cd.IPropertiesUpdatePayload => {
  return values.reduce<cd.IPropertiesUpdatePayload>(
    (acc, curr) => deepMerge(acc, curr, false), // merge properties but don't filter out null.
    {} as cd.IPropertiesUpdatePayload
  );
};

const mergeUpdates = (values: cd.IPropertiesUpdatePayload[]): cd.IPropertiesUpdatePayload[] => {
  const updateSet = new Set();
  return values.reduce<cd.IPropertiesUpdatePayload[]>((acc, curr) => {
    const { elementId } = curr;
    if (!updateSet.has(elementId)) {
      updateSet.add(elementId);
      const props = findAllSimilarProperties(elementId, values);
      const merged = mergeProps(props);
      acc.push(merged);
    }
    return acc;
  }, []);
};

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

/**
 * Given an array of items, and an insert location
 * compute what updates will be necessary to perform
 */
export const insertElements = (
  // These ids can be existing ids contained in the ElementPropertiesMap or they can be ids of items
  // in the array of newElements.
  // The ids should be for the items that are at the root of the subtree being inserted
  insertedIds: string[],
  insertLocation: cd.IInsertLocation,
  currentProperties: cd.ElementPropertiesMap,
  newElements: cd.PropertyModel[] = [],
  showPreviewStyles = false
): cd.IPropertiesUpdatePayload[] => {
  const insertionUpdates: cd.IPropertiesUpdatePayload[] = [];
  const { elementId: insertTargetId, relation } = insertLocation;

  // Create a clone of the currentProperties but exclude roots we're not using
  const mergedProperties = getTargetProperties(currentProperties, [insertTargetId, ...insertedIds]);
  // const mergedProperties = JSON.parse(JSON.stringify(currentProperties));

  // if we are inserting new elementts, we need to include update to add each one
  // also need to insert them in the properties map so we can look up them up in
  // calculations below (e.g. moving children, finding parent, etc)

  for (const element of newElements) {
    // New elements should not already have a parent id.
    // Deleting here in case parentId was copied over from previous element;
    const { id: elementId } = element;
    const { parentId, ...props } = element;
    // Ensure position is reset
    const properties = { ...props, position: [] };
    insertionUpdates.push({ elementId, properties });
    mergedProperties[elementId] = properties;
  }

  // Determine new parent for inserted elements (could be an item in newElements)
  const insertTargetProps = mergedProperties[insertTargetId];
  if (!insertTargetProps) return [];
  const newParent = getInsertParent(relation, insertTargetProps, mergedProperties);
  if (!newParent) return [];
  const { id: newParentId, rootId: newRootId, projectId } = newParent;

  // Below we remove child ids on previous parents of inserted items.
  // Potentially, a parent will have multiple children removed.
  // This map stores childId arrays that will contain all remove operations
  // and below we push a single update for each to set.
  const childIdsForOldParents = new Map<string, string[]>();

  // First loop through each insertion item and remove it from it's current parent (if needed)
  for (const id of insertedIds) {
    const propertyModel = mergedProperties[id];
    if (!propertyModel) continue;
    const { parentId: currentParentId } = propertyModel;
    // only if not a new item or copied item, remove it from it's current parent
    // also, don't remove from currentParent if it is the newParent
    // (it is possible to be just changing position within same parent)
    if (currentParentId && currentParentId !== newParentId && mergedProperties[currentParentId]) {
      // if we've already removed a child from this parent.
      // Get childIds array that has already been updated
      const parentProps = mergedProperties[currentParentId] as cd.PropertyModel; // Checked in if statement above
      const childIds = childIdsForOldParents.get(currentParentId) || [...parentProps.childIds];
      const index = childIds.indexOf(propertyModel.id);
      const updated = removeValueFromArrayAtIndex(index, childIds);
      childIdsForOldParents.set(currentParentId, updated);
    }

    // Also, determine whether to add preview styles to insert item (for drag preview)
    const propertyUpdates = { showPreviewStyles };
    insertionUpdates.push({ elementId: id, properties: propertyUpdates });
  }

  // After assembling all remove updates, push them into updates array
  for (const child of childIdsForOldParents.entries()) {
    const [elementId, childIds] = child;
    const props = mergedProperties[elementId];
    if (!props) continue;

    insertionUpdates.push({ elementId, properties: { childIds } });
    // also need to go ahead and apply these updates into mergedProperties
    // so that computing moveChildren below will include with these updates
    mergedProperties[elementId] = { ...props, childIds }; // don't mutate, assign new object
  }

  // Then calculate order of childIds in new parent and assign
  const newChildIds = insertChildren(insertedIds, newParent, relation, insertTargetId);
  insertionUpdates.push({ elementId: newParentId, properties: { childIds: newChildIds } });

  // Then need to assign new positions for this child and
  // for it's siblings since they have potentially shifted

  const positionUpdates = moveChildren(
    newParentId,
    newChildIds,
    projectId,
    newRootId,
    mergedProperties
  );

  insertionUpdates.push(...positionUpdates);
  return mergeUpdates(insertionUpdates);
};

const shouldElementMove = (
  element: cd.PropertyModel,
  rootId: string,
  parentId: string
): boolean => {
  if (element.id === parentId) return false; // Should not point to itself
  return rootId !== element.rootId || element.parentId !== parentId;
};

const moveChildren = (
  parentId: string,
  parentChildIds: string[],
  projectId: string,
  rootId: string,
  elementProps: cd.ElementPropertiesMap
): cd.IPropertiesUpdatePayload[] => {
  return parentChildIds.reduce<cd.IPropertiesUpdatePayload[]>((acc, elementId) => {
    const element = elementProps[elementId];
    if (!element) return acc;

    if (shouldElementMove(element, rootId, parentId)) {
      const update = { elementId, properties: { parentId, rootId, projectId } };
      acc.push(update);
    }

    const { childIds } = element;
    const childUpdates = moveChildren(elementId, childIds, projectId, rootId, elementProps);
    acc.push(...childUpdates);
    return acc;
  }, []);
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

// Utility to calculate where to insert children into new parent based on drop relation
const insertChildren = (
  childIds: string[], // ids that are to be inserted
  newParent: cd.PropertyModel,
  relation: cd.InsertRelation,
  relationTargertId: string // id of the target that the DropRelation is relative to
): string[] => {
  // before inserting the ids into new child array
  // first, make sure to filter them out of current array first (to ensure they won't be duplicated)
  // It is possible that an id is already children of the parent and is just being moved
  // This does assume that the relationTargertId is not also an id being inserted,
  // but this should not be allowed (e.g. dragging over self)
  // newChildIds is the starting point to where the ids to be inserted will be added
  const newChildIds = newParent.childIds.filter((id) => childIds.indexOf(id) === -1);

  // Prepend new children
  if (relation === cd.InsertRelation.Prepend) {
    return childIds.concat(newChildIds);
  }
  // Before Target
  if (relation === cd.InsertRelation.Before) {
    // Fix: If the relation target is one of the child ids don't remove and re-insert
    if (childIds.includes(relationTargertId) && newParent.childIds.includes(relationTargertId)) {
      return newParent.childIds;
    }
    const idx = newChildIds.findIndex((id) => id === relationTargertId);
    newChildIds.splice(idx, 0, ...childIds);
  } else if (relation === cd.InsertRelation.After) {
    const idx = newChildIds.findIndex((id) => id === relationTargertId) + 1;
    newChildIds.splice(idx, 0, ...childIds);
  } else {
    // concat equates to DropRelation.Append which is default
    newChildIds.push(...childIds);
  }

  return newChildIds;
};
