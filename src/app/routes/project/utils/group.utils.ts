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
import {
  convertPropsUpdateToUpdateChanges,
  createElementChangePayload,
  mergeChangeIntoProperties,
} from 'cd-common/utils';

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
  const childStyleChanges: cd.IElementChangePayload[] = [];
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
    const childUpdateChanges = convertPropsUpdateToUpdateChanges(childStyles);
    const childChange = createElementChangePayload(undefined, childUpdateChanges);
    childStyleChanges.push(childChange);
  }
  /////////////////////////////////////////////////////////////////////
  const { id: groupElementId } = newParent;
  // insert new parent at location of topChild
  const added = [newParent];
  const groupId = [groupElementId];
  // need to apply insert updates to elementProperties
  const insertChange = models.insertElements(groupId, insertLocation, elementProps, added);
  // so that move updates below are computed correctly
  // this also includes mergingin in update to add newParent
  elementProps = mergeChangeIntoProperties(elementProps, insertChange);
  // move existing propertyModels into new parent
  const moveLocation = utils.buildInsertLocation(groupElementId, cd.InsertRelation.Append);
  const moveChange = models.insertElements(sortedIds, moveLocation, elementProps);
  const changes = [insertChange, moveChange, ...childStyleChanges];
  return { groupElementId, changes };
};

/**
 * Ensure that the parent of each deleted element has the correct childIds assigned
 * This addresses an issue where multiselect + ungroup and removes duplicate updates
 *
 * TODO: This shouldn't be necessary once we move to fractional indices
 */
const stanitizeUpdates = (
  changes: cd.IElementChangePayload[],
  deletes: string[]
): cd.IElementChangePayload[] => {
  // Only an issue for multi-select
  if (deletes.length === 1) return changes;

  const allSets = changes.flatMap((c) => c.sets || []);
  const allUpdates = changes.flatMap((c) => c.updates || []);
  const allDeletes = changes.flatMap((c) => c.deletes || []);

  const sanitizedUpdates = allUpdates
    .reduce<cd.IUpdateChange<cd.PropertyModel>[]>((acc, updateChange) => {
      const updateIsDeleted = deletes.includes(updateChange.id);
      const parentId = updateChange.update.parentId;
      const updateHasParentIdThatDoesntExist = parentId && deletes.includes(parentId);
      if (!updateIsDeleted && !updateHasParentIdThatDoesntExist) {
        const dupeIdx = acc.findIndex((item) => item.id === updateChange.id);
        if (dupeIdx !== -1) {
          // Ensure duplicate childIds are merged
          const dupe = acc[dupeIdx];
          const dupeChildIds = dupe.update.childIds || [];
          const updateChildIds = updateChange.update.childIds || [];
          const childIds = new Set([...dupeChildIds, ...updateChildIds]);
          const mergedIds = [...childIds];
          acc[dupeIdx].update.childIds = mergedIds;
        } else {
          acc.push(updateChange);
        }
      }
      return acc;
    }, [])
    .map((updateChange, _idx, arr) => {
      // Verifies that each childId exists on the parent element
      // Could be combined with the reduce above
      const { parentId } = updateChange.update;
      if (parentId) {
        const parentIdx = arr.findIndex((item) => item.id === parentId);
        if (parentIdx !== -1) {
          const parent = arr[parentIdx];
          const childIds = (parent && parent.update.childIds) || [];
          const hasChildId = childIds.includes(updateChange.id);
          if (!hasChildId) {
            arr[parentIdx].update.childIds = [...childIds, updateChange.id];
          }
        }
      }
      return updateChange;
    });

  const sanitizedChange = createElementChangePayload(allSets, sanitizedUpdates, allDeletes);
  return [sanitizedChange];
};

export const unGroupElements = (
  elements: cd.PropertyModel[],
  elementProps: cd.ElementPropertiesMap,
  renderRects: cd.RenderRectMap
): cd.IUngroupElementsPayload => {
  const changes: cd.IElementChangePayload[] = [];
  const deletes: string[] = [];
  const unGroupedIds: string[] = [];

  // for each id, we need to take its children and insert into parent, then delete it
  for (const el of elements) {
    const { id, childIds } = el;
    if (childIds.length === 0) break; // don't ungroup element with no children
    const moveLocation = utils.buildInsertLocation(id, cd.InsertRelation.Before);
    const moveChange = models.insertElements(childIds, moveLocation, elementProps);
    const childStyleChange = aUtils.ungroupAbsolutePositionChildren(el, elementProps, renderRects);
    changes.push(moveChange, childStyleChange);
    unGroupedIds.push(...childIds);
    deletes.push(el.id);
  }

  const sanitizedChanges = stanitizeUpdates(changes, deletes);
  const deletionChange = createElementChangePayload(undefined, undefined, deletes);
  const allChanges = [...sanitizedChanges, deletionChange];

  return { changes: allChanges, unGroupedIds };
};
