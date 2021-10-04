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

import { isBoard, isRoot, iconForComponent } from 'cd-common/models';
import { IObjectIcon, IObjectNode } from './data-tree.interfaces';
import { mapFromArrayOfObjectsWithId } from 'cd-utils/map';
import {
  DATASET_DELIMITER,
  HIDDEN_ATTR,
  MAT_RIPPLE_ATTR,
  REFERENCE_ID,
  RICH_TEXT_ATTR,
} from 'cd-common/consts';
import { isDataBoundValue } from 'cd-common/utils';
import { isObject } from 'cd-utils/object';
import * as cd from 'cd-interfaces';

export const OBJ_TYPE = 'object';

const INPUT_ICON: IObjectIcon = { name: 'label', size: cd.ComponentSize.Small };
const ICON_DEFAULT_CONFIG: IObjectIcon = { name: '', size: cd.ComponentSize.Small };
const EXCLUDED_INPUTS = [HIDDEN_ATTR, MAT_RIPPLE_ATTR, REFERENCE_ID, RICH_TEXT_ATTR];
const EXCLUDED_PREFIX = '_';
const INPUTS_KEY = 'inputs';
const NULL_VALUE = 'null';

type InputObjectType = [string, any][];

const generateNode = (
  id: string,
  title: string,
  level = 0,
  pos: number[],
  parent?: string,
  type?: string,
  children = false,
  selectable = true,
  icon = ICON_DEFAULT_CONFIG,
  rootId?: string,
  inputs = false
): IObjectNode => {
  return { id, title, type, level, pos, parent, rootId, selectable, children, icon, inputs };
};

const generateRootNode = ({ id, name }: cd.IPickerDataset) => {
  const rootNode = generateNode(id, name, 0, [], undefined, undefined, true, true);
  rootNode.rootId = id;
  return rootNode;
};

/** Generates a root node for the current document and children */
export const convertGenericDataToTreeNodes = (
  parsedData: {},
  dataSet?: cd.IPickerDataset
): IObjectNode[] => {
  if (!dataSet) return flattenDataObject(parsedData);
  const rootNode = generateRootNode(dataSet);
  const cells = flattenDataObject(parsedData, undefined, 1, [0]);
  return [rootNode, ...cells];
};

export const flattenDataObject = (
  obj: any,
  key = '',
  level = 0,
  position: number[] = [],
  icon?: IObjectIcon
): IObjectNode[] => {
  const nodes: IObjectNode[] = [];
  const entries = Object.entries(obj);
  for (let i = 0; i < entries.length; i++) {
    const item = entries[i];
    const [nodeKey, value] = item;
    const nodeType = typeof value;
    const isNull = value === null;
    const isObjectType = nodeType === OBJ_TYPE && !isNull;
    const id = key ? `${key}.${nodeKey}` : nodeKey;
    const pos: number[] = [...position, i];
    const line = generateNode(id, nodeKey, level, pos, key, nodeType, isObjectType);

    if (isNull) {
      line.value = NULL_VALUE;
    } else if (!isObjectType) {
      line.value = String(value);
      if (icon) line.icon = icon;
    }

    nodes.push(line);
    if (isObjectType) {
      const children = flattenDataObject(value, id, level + 1, pos, icon);
      nodes.push(...children);
    }
  }

  return nodes;
};

const areAncestorsVisible = (
  node: IObjectNode,
  data: IObjectNode[],
  expanded: Set<string>,
  nodeMap: Map<string, IObjectNode>
): boolean => {
  const parentId = node.parent;
  const parentNode = parentId && nodeMap.get(parentId);
  if (!parentNode) return true;
  const parentIsCollapsed = expanded.has(parentNode.id);
  if (!parentIsCollapsed) return false;
  return areAncestorsVisible(parentNode, data, expanded, nodeMap);
};

/** Returns an array of ancestor ids for a given node */
const getAncestorsForId = (
  id: string,
  nodeMap: Map<string, IObjectNode>,
  ids: string[] = []
): string[] => {
  if (id) ids.push(id);
  const parentId = nodeMap.get(id)?.parent;
  return parentId ? [...ids, ...getAncestorsForId(parentId, nodeMap)] : ids;
};

/** Given a search filter value,
 * find all value and title matches and return their ids w/ ancestors
 */
const getFilteredNodes = (
  data: IObjectNode[],
  nodeMap: Map<string, IObjectNode>,
  filterValue = ''
): Set<string> => {
  const filterSet = new Set<string>();
  const matchSet = new Set<string>();
  if (!filterValue) return filterSet;
  const searchValue = filterValue.toLowerCase();

  for (const item of data) {
    const valueStr = item.value?.toString().toLocaleLowerCase();
    const titleStr = item.title?.toString().toLocaleLowerCase();

    if (!valueStr?.includes(searchValue) && !titleStr.includes(searchValue)) continue;
    filterSet.add(item.id);
    matchSet.add(item.id);
    if (!item.parent) continue;
    const ancestors = getAncestorsForId(item.parent, nodeMap);
    for (const ancestor of ancestors) {
      filterSet.add(ancestor);
    }
  }

  for (const item of data) {
    if (item.parent && matchSet.has(item.parent)) {
      filterSet.add(item.id);
    }
  }

  return filterSet;
};

export const getVisibleCells = (
  data: IObjectNode[],
  expanded: Set<string>,
  filterValue = ''
): IObjectNode[] => {
  const nodeMap = mapFromArrayOfObjectsWithId(data);

  if (filterValue) {
    const filteredIds = getFilteredNodes(data, nodeMap, filterValue);
    return data.filter((item) => {
      return !filterValue || filteredIds.has(item.id) || item.id === item?.rootId;
    });
  }

  return data.filter((value) => areAncestorsVisible(value, data, expanded, nodeMap));
};

export const getSelectedBoardCells = (
  data: IObjectNode[],
  selectedBoardId: string
): IObjectNode[] => {
  return data.filter((value: IObjectNode) => value.rootId === selectedBoardId);
};

const getElementValues = (elements: cd.ElementPropertiesMap): cd.PropertyModel[] => {
  return Object.values(elements) as cd.PropertyModel[];
};

const getBoardsFromElements = (elements: cd.ElementPropertiesMap): cd.PropertyModel[] => {
  return getElementValues(elements).filter(isBoard);
};

const getTopLevelItemsFromElements = (elements: cd.ElementPropertiesMap): cd.PropertyModel[] => {
  return getElementValues(elements).filter(isRoot);
};

const getElementsForSymbol = (
  elements: cd.ElementPropertiesMap,
  symbolId: string
): cd.PropertyModel[] => {
  const symbol = elements[symbolId];
  return symbol ? [symbol] : [];
};

/** Filter out any excluded inputs or any inputs that are currently data-boudn */
const getValidInputsList = (inputs: cd.IStringMap<any>): InputObjectType => {
  return Object.entries(inputs).filter(([key, value]) => {
    return (
      // First character in the key is not an underscore
      key[0] !== EXCLUDED_PREFIX &&
      // Key is not one of the excluded keys
      !EXCLUDED_INPUTS.includes(key) &&
      !isDataBoundValue(value)
    );
  });
};

const processChildInputs = (
  inputList: InputObjectType,
  id: string,
  nextLevel: number,
  pos: number[]
): IObjectNode[] => {
  const inputs: IObjectNode[] = [];
  for (const [key, value] of inputList) {
    const valueIsObject = isObject(value);
    const valueType = typeof value;
    const binding = [id, INPUTS_KEY, key].join(DATASET_DELIMITER); // id.inputs.key
    // When an input has an array or object, we unwrap it so users can select parts
    if (valueIsObject) {
      const inputParent = generateNode(binding, key, nextLevel, pos, id, valueType, true, true);
      const childLevel = nextLevel + 1;
      const secondaryInputs = flattenDataObject(value, binding, childLevel, pos, INPUT_ICON);
      inputs.push(inputParent, ...secondaryInputs);
    } else {
      const input = generateNode(binding, key, nextLevel, pos, id, valueType, false, true);
      input.value = JSON.stringify(value);
      input.icon = INPUT_ICON;
      inputs.push(input);
    }
  }

  return inputs.flat();
};

const generateBoardChildren = (
  elementId: string,
  props: cd.ElementPropertiesMap,
  position = [],
  level = 1,
  filterElementIds: string[] = []
): IObjectNode[] => {
  const element = props[elementId];
  if (!element) return [];
  const nodes: IObjectNode[] = [];
  const ids = element.childIds ?? [];

  for (let i = 0; i < ids.length; i++) {
    const childId = ids[i];
    const child = props[childId];
    if (!child) continue;
    const { id, name: title, childIds } = child;
    const isExcluded = filterElementIds.includes(id);

    if (isExcluded && childIds.length === 0) continue;

    const inputs = (!isExcluded && (child as any)?.inputs) || {};
    const inputList = getValidInputsList(inputs);
    const hasChildren = childIds.length > 0 || inputList.length > 0;
    const pos: number[] = [...position, i];
    const elem = generateNode(id, title, level, pos, elementId, undefined, hasChildren, false);
    const nextLevel = level + 1;
    const childInputs = processChildInputs(inputList, id, nextLevel, pos);

    if (!hasChildren && !childInputs.length) continue;

    const elemChildren = generateBoardChildren(id, props, position, nextLevel, filterElementIds);
    nodes.push(elem, ...childInputs, ...elemChildren);
  }

  return nodes;
};

export const convertElementPropsToNodes = (
  props: cd.ElementPropertiesMap,
  filterElementIds: string[] = [],
  symbolId?: string
): IObjectNode[] => {
  const boards = symbolId ? getElementsForSymbol(props, symbolId) : getBoardsFromElements(props);
  return boards.reduce<IObjectNode[]>((acc, item, i) => {
    const { id, name: title, childIds } = item as cd.PropertyModel;
    const hasChildren = childIds.length > 0;
    const boardElem = generateNode(id, title, 0, [i], '', undefined, hasChildren, false);
    const boardChildren = generateBoardChildren(id, props, [], 1, filterElementIds);
    acc.push(boardElem, ...boardChildren);
    return acc;
  }, []);
};

export const convertA11yElementPropsToNodes = (props: cd.ElementPropertiesMap): IObjectNode[] => {
  const topLevelItems = getTopLevelItemsFromElements(props);
  return topLevelItems.reduce<IObjectNode[]>((acc, item) => {
    const { id } = item as cd.PropertyModel;
    const itemChildren: IObjectNode[] = generateA11yChildren(id, props, id);
    acc.push(...itemChildren);
    return acc;
  }, []);
};

const generateA11yChildren = (
  elementId: string,
  props: cd.ElementPropertiesMap,
  rootId: string,
  parentId?: string,
  position: number[] = [0],
  level = 0
): IObjectNode[] => {
  const element = props[elementId];
  if (!element) return [];
  const { name: title, childIds } = element;
  const a11yInputs: cd.IA11yInputs = (element as any)?.a11yInputs || {};
  const attrList = a11yInputs.ariaAttrs?.filter(({ value }) => value) || [];
  const hasA11yInfo = !!(attrList?.length || a11yInputs.notes);
  const hasChildren = childIds.length > 0;
  const iconName = iconForComponent(element as cd.PropertyModel);
  const icon: IObjectIcon = { name: iconName, size: cd.ComponentSize.Medium };
  const nextLevel = level + 1;

  const elemNode = generateNode(
    elementId,
    title,
    level,
    position,
    parentId,
    undefined,
    hasChildren,
    true,
    icon,
    rootId,
    hasA11yInfo
  );

  const elemChildren = element.childIds.reduce<IObjectNode[]>((acc, childId, i) => {
    const child = props[childId];
    if (!child) return acc;
    const pos = [...position, i];
    const children = generateA11yChildren(childId, props, rootId, elementId, pos, nextLevel);
    acc.push(...children);
    return acc;
  }, []);

  return [elemNode, ...elemChildren];
};
