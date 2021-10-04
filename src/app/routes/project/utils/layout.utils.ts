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

import { createId } from 'cd-utils/guid';
import {
  buildInsertLocation,
  createElementChangePayload,
  createElementUpdate,
  deepMerge,
  getElementBaseStyles,
  mergeChangeIntoProperties,
} from 'cd-common/utils';
import * as models from 'cd-common/models';
import * as cd from 'cd-interfaces';

/** Converts a layout definition to an array of Generic elements (DIVs) */
const elementsFromLayoutDef = (
  def: cd.ILayoutDefinition,
  projectId: string,
  rootId: string,
  parentId: string,
  root: cd.PropertyModel
): cd.IGenericProperties[] => {
  const id = createId();
  const childList = def.children || [];
  const children = childList
    .map((item) => elementsFromLayoutDef(item, projectId, rootId, id, root))
    .flat();

  const styles = def.isInsertTarget ? mergeBaseStyles(root, def.baseStyle) : def.baseStyle;

  const element = models
    .createInstance(cd.ElementEntitySubType.Generic, projectId, id)
    .assignName(def.label)
    .replaceBaseStyles(styles)
    .assignRootId(rootId)
    .assignParentId(parentId)
    .build() as cd.IGenericProperties;

  element.childIds = children.filter((child) => child.parentId === id).map((child) => child.id);
  return [element, ...children];
};

const mergeBaseStyles = (
  root: cd.PropertyModel,
  styles: cd.ILayoutDefinition['baseStyle']
): cd.IStyleDeclaration => {
  const base = getElementBaseStyles(root);
  const background = base?.background?.length > 0 ? base?.background : styles?.background || [];
  const display = base?.display ? base?.display : styles?.display;
  const merged = deepMerge(base, styles);
  return { ...merged, display, background };
};

const flattenLayout = (def: cd.ILayoutDefinition): cd.ILayoutDefinition[] => {
  const childList = def.children || [];
  return [def, ...childList.map((item) => flattenLayout(item)).flat()];
};

/**
 * This recursively returns an index of property: isInsertTarget
 * that corresponds to the order of the array created by elementsFromLayoutDef above   */
const indexOfInsertLocation = (def: cd.ILayoutDefinition): number => {
  return flattenLayout(def).findIndex((item) => item.isInsertTarget === true);
};

/**
 * Merges the styles of the selected element to the root layout definition
 */
const mergeRootStyleUpdates = (
  root: cd.PropertyModel,
  selected: cd.PropertyModel
): cd.IElementChangePayload => {
  const styles = deepMerge(selected.styles, root.styles);
  const update = createElementUpdate(selected.id, { styles });
  return createElementChangePayload(undefined, [update]);
};

/** When we create a layout from a defintion an id
 * is generated for the root element, we want to remap
 * that to the selected board or element's id */
const remapParentId = (
  baseParentId: string,
  remappedId: string,
  elements: cd.IGenericProperties[]
): [processed: cd.IGenericProperties[], insertIds: string[]] => {
  const processed: cd.IGenericProperties[] = [];
  const insertIds: string[] = [];
  for (const element of elements) {
    if (element.parentId === baseParentId) {
      insertIds.push(element.id);
      element.parentId = remappedId;
    }
    processed.push(element);
  }
  return [processed, insertIds];
};

/**
 * Relocates the children of a selected element or board
 * into the insertPoint defined in a layout definition
 */
const moveSelectedChildren = (
  insertPointId: string | undefined,
  firstSelected: cd.PropertyModel,
  elementProps: cd.ElementPropertiesMap
): cd.IElementChangePayload[] => {
  if (!insertPointId) return [];
  const elements = firstSelected.childIds.map((id) => elementProps[id]) as cd.PropertyModel[];
  const positionMap = models.buildPositionMapForElements(elements, elementProps);
  const sortedElements = models.sortElementsByPosition(elements, positionMap);
  const sortedIds = sortedElements.map((el) => el.id);
  const insertLocation = buildInsertLocation(insertPointId, cd.InsertRelation.Append);
  const change = models.insertElements(sortedIds, insertLocation, elementProps);
  return [change];
};

export const applyLayoutPreset = (
  selected: cd.PropertyModel[],
  preset: cd.ILayoutDefinition,
  elementProps: cd.ElementPropertiesMap
): {
  insertPointId?: string;
  changes: cd.IElementChangePayload[];
} => {
  const [firstSelected] = selected;
  if (!firstSelected) return { changes: [] };
  const { projectId, rootId, id } = firstSelected as cd.PropertyModel;
  const elements = elementsFromLayoutDef(preset, projectId, rootId, id, firstSelected);
  const [base, ...created] = elements;
  const [processed, insertIds] = remapParentId(base.id, id, created);
  const styleChange = mergeRootStyleUpdates(base, firstSelected);
  const insertIdx = indexOfInsertLocation(preset);
  const insertElem = elements[insertIdx];
  const insertPointId = insertElem?.id;
  const insertLocation = buildInsertLocation(id, cd.InsertRelation.Append);
  const insertChange = models.insertElements(insertIds, insertLocation, elementProps, processed);
  const updatedProps = mergeChangeIntoProperties(elementProps, insertChange);
  const moveChildren = moveSelectedChildren(insertPointId, firstSelected, updatedProps);
  const changes = [insertChange, ...moveChildren, styleChange];
  return { changes, insertPointId };
};

export const generateLayout = (
  selected: cd.PropertyModel,
  elementProps: cd.ElementPropertiesMap,
  level = 0
): cd.ILayoutDefinition => {
  const { name, styles, childIds, attrs } = selected;
  const baseStyle = styles.base.style;
  const label = level === 0 ? '' : name; // clear name for root
  const MAIN_ATTR = 'main'; // Look for an attribute named 'main'
  const isInsertTarget = attrs.some((item) => item.name === MAIN_ATTR);
  const insert = isInsertTarget && { isInsertTarget };
  const children = childIds.reduce<cd.ILayoutDefinition[]>((acc, childId) => {
    const child = elementProps[childId];
    if (!child) return acc;
    const isBoardOrElement = models.isBoard(child) || models.isGeneric(child);
    if (!isBoardOrElement) return acc;
    acc.push(generateLayout(child, elementProps, level + 1));
    return acc;
  }, []);

  return { label, baseStyle, children, ...insert };
};
