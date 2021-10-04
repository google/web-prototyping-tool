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
import * as models from 'cd-common/models';
import { approxDist, createPoint, IPoint } from 'cd-utils/geometry';
import { incrementedName } from 'cd-utils/string';
import { FlatLayersNode } from '../interfaces/layers.interface';
import { CHILD_INDENT_AMOUNT, INDENT_PER_LEVEL } from '../components/layers-tree/layers.config';
import { buildInsertLocation, convertPropsUpdateToUpdateChanges } from 'cd-common/utils';

const CANVAS_CLASSNAME = 'app-canvas';
const MULTIPLE_ITEMS_LABEL = 'items';
const LAYERS_TREE_DROP_TARGET_ROWS = 3;
const EXCLUDE_FROM_NAME_INCREMENT = [cd.ElementEntitySubType.Icon, cd.ElementEntitySubType.Text];

export const incrementNameForEntity = (
  instance: cd.IComponentInstance,
  entity: cd.ComponentIdentity,
  props: cd.ElementPropertiesMap
): string => {
  if (EXCLUDE_FROM_NAME_INCREMENT.includes(entity as cd.ElementEntitySubType)) return instance.name;
  const definedModels = models.getModels(props);
  const names = definedModels
    .filter((item) => item.elementType === entity)
    .map((item) => item.name);
  return incrementedName(instance.name, names);
};

export enum DragItemType {
  Default,
  TreeNode,
  Asset,
  Symbol,
}

export interface IActiveDragItem extends IPoint {
  dragIds: string[];
}

export const getDomRect = (element: HTMLElement): DOMRect => {
  return element.getBoundingClientRect() as DOMRect;
};

export const assetIdFromProperties = (element: cd.PropertyModel): string => {
  const elem = element as cd.IImageProperties;
  return elem.inputs.src.id || '';
};

export const isTargetCanvas = (evtTarget: EventTarget | null): boolean => {
  const target = evtTarget as HTMLElement;
  return target.className === CANVAS_CLASSNAME;
};

export const dragItemsFromSelection = (
  id: string,
  elementProperties: cd.ElementPropertiesMap,
  selectedIds: Set<string>
): cd.PropertyModel[] => {
  const props = elementProperties[id];
  if (props && !selectedIds.has(id)) return [props];
  const selectedElements = models.lookupElementIds([...selectedIds], elementProperties);
  return models.sortAndFilterElements(selectedElements, elementProperties);
};

export const calcDesignSurfaceDropLocation = (
  _e: MouseEvent,
  elementId: string,
  elementProperties: cd.ElementPropertiesMap
): cd.IInsertLocation => {
  const { Append, After } = cd.InsertRelation;
  const location = buildInsertLocation(elementId, After);
  const targetInstance = elementProperties[elementId];

  // Append if children allowed
  if (targetInstance) {
    const cmp = models.getComponent(targetInstance.id);
    if (cmp && cmp.childrenAllowed) {
      location.relation = Append;
    }
  }

  return location;
};

/** Find where ancestors branch */
const indexWhereAncestorHasSibling = (
  ancestors: string[],
  elementProperties: cd.ElementPropertiesMap
): number => {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const id = ancestors[i];
    const props = elementProperties[id];
    const parentProps = props?.parentId && elementProperties[props.parentId];
    if (!parentProps) continue;
    const hasSibling = parentProps.childIds.indexOf(id) !== parentProps.childIds.length - 1;
    if (hasSibling) return i;
  }
  return -1;
};

const nextSiblingIdForElement = (
  id: string,
  elementProperties: cd.ElementPropertiesMap
): string | undefined => {
  const props = elementProperties[id];
  const parentProps = props?.parentId && elementProperties[props.parentId];
  if (!parentProps) return;
  const idx = parentProps.childIds.indexOf(id);
  return parentProps.childIds[idx + 1];
};

export interface ITreeDropPayload {
  layersNode: FlatLayersNode;
  expanded: boolean;
  isChildOfSelf: boolean;
}

const isLastElementInGroup = (
  targetProps: cd.PropertyModel,
  elementProperties: cd.ElementPropertiesMap
) => {
  const parentProps = targetProps.parentId && elementProperties[targetProps.parentId];
  return parentProps
    ? parentProps.childIds.indexOf(targetProps.id) === parentProps.childIds.length - 1
    : false;
};

export const calcLayersTreeDropLocation = (
  e: MouseEvent,
  payload: ITreeDropPayload,
  elementProperties: cd.ElementPropertiesMap
): cd.IInsertLocation | undefined => {
  const { layersNode, expanded, isChildOfSelf } = payload;
  const targetId = layersNode.id;
  const targetInstance = elementProperties[targetId];
  const currentTarget = e.currentTarget as HTMLElement;
  if (!targetInstance) return; // Ignore unknown
  const cmp = models.getComponent(targetInstance.elementType);
  if (!cmp) return undefined;

  // debugHighlightNode(currentTarget);

  // For Root elements always prepend
  if (models.isRootSubtype(targetInstance.elementType)) {
    return buildInsertLocation(targetId, cd.InsertRelation.Prepend);
  }

  const { pageX, pageY } = e;
  const { left, top, height } = getDomRect(currentTarget as HTMLElement);
  // Divide the vertical space of the drop target into 3rds
  // Top for before, Middle for inside (prepend) and Bottom for After
  const rowHeight = height / LAYERS_TREE_DROP_TARGET_ROWS;
  const y = pageY - top;
  const x = pageX - left;

  // vertical top - insert before
  if (y <= rowHeight) {
    if (isChildOfSelf) return; // ignore when current drop target equals drop zone
    return buildInsertLocation(targetId, cd.InsertRelation.Before);
  }

  const isTargetLastInGroup = isLastElementInGroup(targetInstance, elementProperties);
  const isGroupAndExpanded = targetInstance.childIds.length && expanded;

  // Here we're generating a series of ancestor targets (columns) to the left of the
  // drop zone's label that point to parentIds

  if (!isGroupAndExpanded && isTargetLastInGroup) {
    const columns = layersNode.ancestors.length - 1;
    const ancestorWidth = INDENT_PER_LEVEL * layersNode.ancestors.length + CHILD_INDENT_AMOUNT;
    if (x <= ancestorWidth) {
      const colWidth = ancestorWidth / columns;
      // Based on the cursor position find the ancestorId based on the number of ancestors
      const ancestorIndex = Math.floor(x / colWidth) + 1;
      // Find where parent nodes branch (IMPORTANT)
      const branchIndex = indexWhereAncestorHasSibling(layersNode.ancestors, elementProperties);
      // Stop ancestor traversal when an ancestor has a sibling,
      // Look up that sibling and insert before
      if (branchIndex !== -1 && ancestorIndex <= branchIndex) {
        const branchId = layersNode.ancestors[branchIndex];
        const siblingId = nextSiblingIdForElement(branchId, elementProperties);
        if (siblingId) return buildInsertLocation(siblingId, cd.InsertRelation.Before);
      }

      const ancestorId = layersNode.ancestors[ancestorIndex];
      if (ancestorId) return buildInsertLocation(ancestorId, cd.InsertRelation.AfterGroup);
    }
  }

  // We want to ignore attempts to prepend or append an element onto itself
  // We don't ignore along the X position since that deals with ancestors
  if (isChildOfSelf) return;

  // vertical middle
  const isMiddleRow = y > rowHeight && y < rowHeight * (LAYERS_TREE_DROP_TARGET_ROWS - 1);
  if ((isGroupAndExpanded || isMiddleRow) && cmp.childrenAllowed) {
    // If generic element or expanded group, prepend
    return buildInsertLocation(targetId, cd.InsertRelation.Prepend);
  }

  // vertical bottom edge cases
  // Groups require special handling since they can be expanded or collapsed
  if (targetInstance.childIds.length && !expanded) {
    // collapsed group but not the last element
    const siblingId = nextSiblingIdForElement(targetId, elementProperties);
    if (siblingId) return buildInsertLocation(siblingId, cd.InsertRelation.Before);
    // If the last element is a Collapsed group, insert after group
    return buildInsertLocation(targetId, cd.InsertRelation.AfterGroup);
  }
  return buildInsertLocation(targetId, cd.InsertRelation.After);
};

export const calcDragLabel = (
  propsMap: cd.ElementPropertiesMap,
  ids?: string[],
  dragAdditions?: cd.PropertyModel[]
): string => {
  if (!ids || ids.length === 0) return '';
  // If multiple items being dragged, use number of items as drag label
  if (ids.length > 1) return `${ids.length} ${MULTIPLE_ITEMS_LABEL}`;
  // else use name of single drag item as label.
  const id = ids?.[0];
  const element = id && propsMap[id];
  if (element) return element.name;

  const dragItem = dragAdditions && dragAdditions[0];
  if (dragItem) return dragItem.name;

  return '';
};

export const isDropTargetAnEmptyBoard = (
  dropTargetId: string,
  propsMap: cd.ElementPropertiesMap
): boolean => {
  const elem = propsMap[dropTargetId];
  return !!elem && dropTargetId === elem.rootId;
};

export const hasMouseMoved = (
  { clientX: ax, clientY: ay }: MouseEvent,
  { clientX: bx, clientY: by }: MouseEvent
): boolean => {
  return ax === bx && ay === by;
};

export const hasMouseMovedSinceDown = (
  { clientX, clientY }: MouseEvent,
  { x, y }: IPoint
): boolean => {
  const deltaX = x - clientX;
  const deltaY = y - clientY;
  const moved = deltaX === 0 && deltaY === 0;
  return moved === false;
};

export class DndMouseCursor {
  private _offset = createPoint();
  private _position = createPoint();
  private _timestamp = 0;
  private _velocity = 0;

  setOffset(value: IPoint) {
    this._offset = value;
    this._timestamp = 0;
    this._velocity = 0;
  }

  get position() {
    return this._position;
  }

  get velocity() {
    return this._velocity;
  }

  get offset() {
    return this._offset;
  }

  get offsetPosition(): IPoint {
    const { _position, _offset } = this;
    const x = _position.x - _offset.x;
    const y = _position.y - _offset.y;
    return { x, y };
  }

  /** assign values, calculate velocity */
  update(x: number, y: number) {
    const now = Date.now();
    const pt = createPoint(x, y);
    if (this._timestamp !== 0) {
      const time = now - this._timestamp;
      const dist = approxDist(this._position, pt);
      this._velocity = dist / time;
    }

    this._position = pt;
    this._timestamp = now;
    return pt;
  }
}

const removePreviewStyleFromModel = (model: cd.PropertyModel): cd.PropertyModel => {
  const { showPreviewStyles, ...otherProperties } = model;
  return otherProperties;
};

const removePreviewStyleFromUpdate = (
  updateChange: cd.IUpdateChange<cd.PropertyModel>
): cd.IUpdateChange<cd.PropertyModel> => {
  const { id, update } = updateChange;
  const { showPreviewStyles, ...otherUpdates } = update;
  return { id, update: otherUpdates };
};

const removePreviewStyles = (changes: cd.IElementChangePayload[]) => {
  return changes.map((change) => {
    const newChange = { ...change };
    const { sets, updates } = newChange;
    if (sets) newChange.sets = sets.map(removePreviewStyleFromModel);
    if (updates) newChange.updates = updates.map(removePreviewStyleFromUpdate);
    return newChange;
  });
};

/**
 * Review the previewStyles (puruple dotted outline) from dropPreview and combine with any
 * absolute positioning updates on drop
 */
export const generateDropChange = (
  dropPreview: cd.IElementChangePayload[] = [],
  absStyleUpdates: ReadonlyArray<cd.IPropertiesUpdatePayload>
): cd.IElementChangePayload[] => {
  const removePreview = removePreviewStyles(dropPreview);
  const absStyleUpdateChanges = convertPropsUpdateToUpdateChanges([...absStyleUpdates]);
  const type = cd.EntityType.Element;
  const absChangePayload: cd.IElementChangePayload[] = [{ type, updates: absStyleUpdateChanges }];

  const merged = [...removePreview, ...absChangePayload];
  return merged;
};
