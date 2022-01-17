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

import { convertToLayout } from '../components/layout-engine/layout-engine.utils';
import * as aUtils from './group.absolute.utils';
import * as models from 'cd-common/models';
import * as utils from 'cd-common/utils';
import * as cd from 'cd-interfaces';
import { createId } from 'cd-utils/guid';

export const GROUP_ELEMENT_NAME = 'Group';

const DEFAULT_GROUP_STYLES = {
  width: null,
  height: null,
  position: cd.PositionType.Relative,
  opacity: { value: '1' },
  borderRadius: null,
  background: null,
  boxShadow: null,
};

const generateGroupParent = (rootId: string, projectId: string): cd.IGenericProperties => {
  const id = createId();
  const name = GROUP_ELEMENT_NAME;
  const entitySubtype = cd.ElementEntitySubType.Generic;
  return models
    .createInstance(entitySubtype, projectId, id)
    .assignName(name)
    .addBaseStyle({})
    .assignRootId(rootId)
    .build();
};

const applyLayoutToGroup = (
  element: cd.IGenericProperties,
  childCount: number,
  layoutMode: cd.LayoutMode = cd.LayoutMode.Auto
): void => {
  const baseStyle = utils.getElementBaseStyles(element) || {};
  const style = convertToLayout(layoutMode, baseStyle, childCount);
  const update = { ...style, ...DEFAULT_GROUP_STYLES };
  utils.assignBaseStyles(element, update);
};

export const groupElements = (
  elements: cd.ReadOnlyPropertyModelList,
  elementProps: cd.ElementPropertiesMap,
  renderRects: cd.RenderRectMap,
  layout?: cd.LayoutMode
): cd.IGroupElementsPayload => {
  // get location of where to creat group
  const childStyleUpdates: cd.IPropertiesUpdatePayload[] = [];
  const positionMap = models.buildPositionMapForElements(elements, elementProps);
  const sortedElements = models.sortElementsByPosition(elements, positionMap);
  const sortedIds = sortedElements.map((el) => el.id);
  const sortedSize = sortedIds.length;
  const [topChild] = sortedElements;
  const insertLocation = utils.buildInsertLocation(topChild.id, cd.InsertRelation.Before);
  const hasAbsolute = aUtils.elementsHaveAbsolutePosition(elements);
  const newParent = generateGroupParent(topChild.rootId, topChild.projectId);

  // Apply styles to group ////////////////////////////////////////////
  applyLayoutToGroup(newParent, sortedSize, layout);

  if (hasAbsolute) {
    const bounds = aUtils.generateBoundingBox(topChild?.parentId, elements, renderRects);
    const hasFixed = aUtils.someElementsHaveFixedPosition(elements);
    aUtils.applyAbsolutePositionToGroup(newParent, bounds, hasFixed);
    const childStyles = aUtils.adjustAbsolutePositionForChildren(bounds, elements, renderRects);
    childStyleUpdates.push(...childStyles);
  }
  /////////////////////////////////////////////////////////////////////
  const { id: groupElementId } = newParent;
  // insert new parent at location of topChild
  const added = [newParent];
  const groupId = [groupElementId];
  // need to apply insert updates to elementProperties
  const insertUpdates = models.insertElements(groupId, insertLocation, elementProps, added);
  // so that move updates below are computed correctly
  // this also includes mergingin in update to add newParent
  elementProps = models.mergeUpdatesIntoProperties(elementProps, insertUpdates);
  // move existing propertyModels into new parent
  const moveLocation = utils.buildInsertLocation(groupElementId, cd.InsertRelation.Append);
  const moveUpdates = models.insertElements(sortedIds, moveLocation, elementProps);
  const updates = [...insertUpdates, ...moveUpdates, ...childStyleUpdates];
  return { groupElementId, updates };
};

/**
 * Ensure that the parent of each deleted element has the correct childIds assigned
 * This addresses an issue where multiselect + ungroup and removes duplicate updates
 */
const stanitizeUpdates = (
  updates: cd.IPropertiesUpdatePayload[],
  deletions: cd.PropertyModel[]
): cd.IPropertiesUpdatePayload[] => {
  // Only an issue for multi-select
  if (deletions.length === 1) return updates;

  const deletedIds = deletions.map((item) => item.id);

  const sanitized = updates
    .reduce<cd.IPropertiesUpdatePayload[]>((acc, update) => {
      const updateIsDeleted = deletedIds.includes(update.elementId);
      const parentId = update.properties.parentId;
      const updateHasParentIdThatDoesntExist = parentId && deletedIds.includes(parentId);
      if (!updateIsDeleted && !updateHasParentIdThatDoesntExist) {
        const dupeIdx = acc.findIndex((item) => item.elementId === update.elementId);
        if (dupeIdx !== -1) {
          // Ensure duplicate childIds are merged
          const dupe = acc[dupeIdx];
          const dupeChildIds = dupe.properties.childIds || [];
          const updateChildIds = update.properties.childIds || [];
          const childIds = new Set([...dupeChildIds, ...updateChildIds]);
          const mergedIds = [...childIds];
          acc[dupeIdx].properties.childIds = mergedIds;
        } else {
          acc.push(update);
        }
      }
      return acc;
    }, [])
    .map((update, _idx, arr) => {
      // Verifies that each childId exists on the parent element
      // Could be combined with the reduce above
      const { parentId } = update.properties;
      if (parentId) {
        const parentIdx = arr.findIndex((item) => item.elementId === parentId);
        if (parentIdx !== -1) {
          const parent = arr[parentIdx];
          const childIds = (parent && parent.properties.childIds) || [];
          const hasChildId = childIds.includes(update.elementId);
          if (!hasChildId) {
            arr[parentIdx].properties.childIds = [...childIds, update.elementId];
          }
        }
      }
      return update;
    });

  return sanitized;
};

export const unGroupElements = (
  elements: cd.PropertyModel[],
  elementProps: cd.ElementPropertiesMap,
  renderRects: cd.RenderRectMap
): cd.IUngroupElementsPayload => {
  const updates: cd.IPropertiesUpdatePayload[] = [];
  const deletions: cd.PropertyModel[] = [];
  const unGroupedIds: string[] = [];

  // for each id, we need to take its children and insert into parent, then delete it
  for (const el of elements) {
    const { id, childIds } = el;
    if (childIds.length === 0) break; // don't ungroup element with no children
    const moveLocation = utils.buildInsertLocation(id, cd.InsertRelation.Before);
    const moveUpdates = models.insertElements(childIds, moveLocation, elementProps);
    const childStyleUpdates = aUtils.ungroupAbsolutePositionChildren(el, elementProps, renderRects);
    updates.push(...moveUpdates, ...childStyleUpdates);
    unGroupedIds.push(...childIds);
    deletions.push(el);
  }

  const sanitizedUpdates = stanitizeUpdates(updates, deletions);

  return { deletions, updates: sanitizedUpdates, unGroupedIds };
};
