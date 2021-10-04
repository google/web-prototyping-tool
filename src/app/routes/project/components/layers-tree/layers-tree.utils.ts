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
import { isIcon, isText, iconForComponent, getComponent } from 'cd-common/models';
import { ILayersNode, FlatLayersNode } from '../../interfaces/layers.interface';
import { areSetsEqual } from 'cd-utils/object';
import { stripHTMLTags, toSentenceCase, truncateText } from 'cd-utils/string';
import { isDataBoundValue, isIValue, sortElementsByName, isMaterialIcon } from 'cd-common/utils';

const enum TreeCellClass {
  ExpandArrow = '.arrow',
  TreeNode = '.tree-node',
  VisibilityToggle = '.vis-toggle',
  GoToBoard = '.goto-board',
  HasAction = '.has-action',
  InputMask = '.input-mask',
}

const MAX_STRING_LEN = 18;
const DEFAULT_ICON_NAME = 'Icon';
const DEFAULT_ELEMENT_NAME = 'Element';
const DATA_BOUND_TEXT = 'data-bound';

export const buildActionsSet = (
  elementProperties: cd.ReadOnlyPropertyModelList
): ReadonlySet<string> => {
  return elementProperties.reduce<Set<string>>((acc, curr) => {
    const actions = curr.actions || [];
    if (actions.length > 0) acc.add(curr.id);
    return acc;
  }, new Set());
};

export const buildIconMap = (
  elementProperties: cd.ReadOnlyPropertyModelList
): ReadonlyMap<string, string> => {
  return elementProperties.reduce((acc, curr) => {
    const icon = iconForComponent(curr);
    if (icon) {
      acc.set(curr.id, icon);
    }
    return acc;
  }, new Map());
};

export const buildHiddenSet = (
  elementProperties: cd.ReadOnlyPropertyModelList
): ReadonlySet<string> => {
  return elementProperties.reduce<Set<string>>((acc, curr) => {
    if (curr.inputs && curr.inputs.hidden) acc.add(curr.id);
    return acc;
  }, new Set());
};

export const buildNameMap = (
  elementProperties: cd.ReadOnlyPropertyModelList
): ReadonlyMap<string, string[]> => {
  return elementProperties.reduce<Map<string, string[]>>((acc, curr) => {
    const cmp = getComponent(curr.elementType);

    const prefix = curr.name || cmp?.title || DEFAULT_ELEMENT_NAME;
    if (isIcon(curr)) {
      const prefixIsDefault = prefix === DEFAULT_ICON_NAME;
      const iconName = (curr as cd.IIconProperties).inputs.iconName;
      const nameValue = isMaterialIcon(iconName) ? iconName : toSentenceCase(iconName.name);
      const textString = prefixIsDefault ? nameValue : prefix;
      acc.set(curr.id, [textString]);
    } else if (isText(curr)) {
      const textProps = curr as cd.ITextProperties;
      const { innerHTML } = textProps.inputs;
      const isDataBound = isIValue(innerHTML) || isDataBoundValue(innerHTML);
      const textValue = String(innerHTML ?? '');
      const text = isDataBound ? DATA_BOUND_TEXT : stripHTMLTags(textValue);
      const str = truncateText(text, MAX_STRING_LEN);
      const output = prefix === str ? [prefix] : [prefix, str];
      acc.set(curr.id, output);
    } else {
      acc.set(curr.id, [prefix]);
    }

    return acc;
  }, new Map());
};

/**
 * Recursively generate data structure for layers tree.
 * Takes our flat ElementPropertiesMap and transforms it into a hierarchical structure
 */
const buildLayersNode = (
  props: cd.IComponentInstance,
  children: ILayersNode[] = []
): ILayersNode => {
  const { id, elementType, parentId, rootId } = props;
  return { id, elementType, parentId, rootId, children };
};

export const generateLayersTreeNodes = (
  ids: string[],
  elementProperties: cd.ElementPropertiesMap,
  homeBoardId?: string,
  sort = true
): ILayersNode[] => {
  const elements = ids.map((id) => elementProperties[id]).filter((p) => !!p) as cd.PropertyModel[];
  const sortedElements = sort ? sortElementsByName(elements, homeBoardId) : elements;
  return sortedElements.reduce<ILayersNode[]>((acc, props) => {
    const children = generateLayersTreeNodes(props.childIds, elementProperties, undefined, false);
    const node = buildLayersNode(props, children);
    acc.push({ ...node });
    return acc;
  }, []);
};

export const getAllDescendantsFromNode = (
  node: FlatLayersNode,
  flatData: FlatLayersNode[],
  flatDataMap: Map<string, FlatLayersNode>
): string[] => {
  let descendants: string[] = [node.id];
  for (const childId of node.children) {
    const childNode = flatDataMap.get(childId);
    if (childNode && childNode.expandable) {
      const grandChildrenIds = getAllDescendantsFromNode(childNode, flatData, flatDataMap);
      descendants = [...descendants, ...grandChildrenIds];
    }
  }
  return descendants;
};

export const toggleSet = (set: Set<string>, id: string) => {
  const updatedSet = new Set(set);
  if (updatedSet.has(id)) updatedSet.delete(id);
  else updatedSet.add(id);
  return updatedSet;
};

const closest = (e: MouseEvent, className: string): HTMLElement | null => {
  return (e.target as HTMLElement).closest(className) as HTMLElement;
};

const isClosest = (e: MouseEvent, className: string): boolean => {
  return closest(e, className) !== null;
};

export const nodeDetailsFromTarget = (
  e: MouseEvent
): { id: string; rootId: string } | undefined => {
  const node = closest(e, TreeCellClass.TreeNode);
  if (!node) return;
  const id = node.dataset.id;
  const rootId = node.dataset.rootid;
  if (!id || !rootId) return;
  return { id, rootId };
};

export const nodeIsInputLabel = (e: MouseEvent): boolean => {
  return isClosest(e, TreeCellClass.InputMask);
};

/** User clicked the expand arrow within a tree cell */
export const nodeIsExpansionArrow = (e: MouseEvent): boolean => {
  return isClosest(e, TreeCellClass.ExpandArrow);
};

/** User clicked the visibility toggle within a tree cell */
export const nodeIsVisibilityToggle = (e: MouseEvent): boolean => {
  return isClosest(e, TreeCellClass.VisibilityToggle);
};

/** User clicked the action button (bolt) within a tree cell */
export const nodeIsActionButton = (e: MouseEvent): boolean => {
  return isClosest(e, TreeCellClass.HasAction);
};

/** User clicked the go to board button within a tree cell */
export const nodeIsGotoBoardButton = (e: MouseEvent): boolean => {
  return isClosest(e, TreeCellClass.GoToBoard);
};

export const flattenData = (
  source: ILayersNode[],
  total: FlatLayersNode[] = [],
  level = 0,
  ancestors: string[] = []
) => {
  for (const node of source) {
    const childIds = node.children.map((child) => child.id);
    const item = new FlatLayersNode(node, childIds, level, ancestors);
    total.push(item);
    if (node.children) {
      const parentList = [...ancestors, node.id];
      const nextLevel = level + 1;
      const items = flattenData(node.children, [], nextLevel, parentList);
      total = [...total, ...items];
    }
  }
  return total;
};

export const identifyNewRootNodes = (
  newData: FlatLayersNode[],
  oldData: FlatLayersNode[]
): string[] => {
  const oldRoots = oldData.filter((item) => item.level === 0).map((item) => item.id);
  const newRoots = newData.filter((item) => item.level === 0).map((item) => item.id);
  return newRoots.reduce<string[]>((acc, curr) => {
    if (!oldRoots.includes(curr)) acc.push(curr);
    return acc;
  }, []);
};

const createIdAndNameSet = (rootElements: cd.IComponentInstance[]): Set<string> => {
  return rootElements.reduce((acc, curr) => {
    acc.add(curr.id);
    acc.add(curr.name);
    return acc;
  }, new Set<string>());
};

export const haveIdsOrNamesChanged = (
  before: cd.PropertyModel[],
  after: cd.PropertyModel[]
): boolean => {
  const beforeSet = createIdAndNameSet(before);
  const afterSet = createIdAndNameSet(after);
  return areSetsEqual(beforeSet, afterSet);
};
