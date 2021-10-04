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

/* eslint-disable max-lines */

import * as cd from 'cd-interfaces';
import { isBoolean } from 'cd-utils/object';
import { isNumber } from 'cd-utils/numeric';

export const getModels = (
  elementProperties: cd.ReadonlyElementPropertiesMap
): cd.ReadOnlyPropertyModelList => {
  return Object.values(elementProperties) as cd.PropertyModel[];
};

export type ReadOnlyPropertyEntries = ReadonlyArray<[id: string, properties: cd.PropertyModel]>;

export const getModelEntries = (
  elementProperties: cd.ReadonlyElementPropertiesMap
): ReadOnlyPropertyEntries => {
  return Object.entries(elementProperties) as ReadOnlyPropertyEntries;
};

export const lookupElementIds = (
  ids: ReadonlyArray<string>,
  elementProperties: cd.ReadonlyElementPropertiesMap
): cd.PropertyModel[] => {
  const props: cd.PropertyModel[] = [];
  for (const id of ids) {
    if (id in elementProperties) {
      props.push(elementProperties[id] as cd.PropertyModel);
    } else {
      console.warn('Attempted to lookup undefined element id', id);
    }
  }
  return props;
};

export const setProjectIdOnContents = <T extends cd.IProjectContentDocument>(
  contents: T[],
  projectId: string
): T[] => {
  return contents.map((c) => ({ ...c, projectId }));
};

/**
 * Filter out root ids and their element subtrees from a component instance group
 */
export const filterOutRootIdsAndChildren = (
  rootIdsToRemove: string[],
  componentInstanceGroup: cd.IComponentInstanceGroup
): cd.IComponentInstanceGroup => {
  const rootIdRemovalSet = new Set(rootIdsToRemove);
  const { rootIds, models } = componentInstanceGroup;
  const elementPropertiesMap = convertModelListToMap(models);
  const filteredRootIds = rootIds.filter((id) => !rootIdRemovalSet.has(id));
  const filteredModels = getModelsAndChildren(filteredRootIds, elementPropertiesMap);
  return { rootIds: filteredRootIds, models: filteredModels };
};

export const getModelsAndChildren = (
  ids: string[],
  elementProperties: cd.ElementPropertiesMap
): cd.PropertyModel[] => {
  return ids.reduce<cd.PropertyModel[]>((acc, currId) => {
    const currModel = elementProperties[currId];
    if (!currModel) return acc;

    acc.push(currModel);
    acc.push(...getModelsAndChildren(currModel.childIds, elementProperties));
    return acc;
  }, []);
};

export const getChildren = (id: string, propsMap: cd.ElementPropertiesMap): cd.PropertyModel[] => {
  const parent = propsMap[id];
  return parent ? getModelsAndChildren(parent.childIds, propsMap) : [];
};

export const convertModelListToMap = (models: cd.PropertyModel[]): cd.ElementPropertiesMap => {
  return models.reduce<cd.ElementPropertiesMap>((acc, model) => {
    acc[model.id] = model;
    return acc;
  }, {});
};

export const getModelsForUpdates = (
  updates: cd.IPropertiesUpdatePayload[],
  elementProperties: cd.ElementPropertiesMap
): cd.ElementPropertiesMap =>
  updates.reduce<cd.ElementPropertiesMap>((acc, curr) => {
    const { elementId } = curr;
    const props = elementProperties[elementId];
    if (props) acc[elementId] = props;
    return acc;
  }, {});

type ElementEntitySubType = Pick<cd.IComponentInstance, 'elementType'>;

export const isBoard = (value: ElementEntitySubType): value is cd.IBoardProperties => {
  return value.elementType === cd.ElementEntitySubType.Board;
};

export const isBoardPortal = (element?: cd.PropertyModel): element is cd.IBoardPortalProperties => {
  return element !== undefined && element?.elementType === cd.ElementEntitySubType.BoardPortal;
};

export const isTabs = (element: cd.PropertyModel): element is cd.ITabProperties => {
  return element?.elementType === cd.ElementEntitySubType.Tabs;
};

export const isGeneric = (value: ElementEntitySubType): value is cd.IGenericProperties => {
  return value.elementType === cd.ElementEntitySubType.Generic;
};

export const isImage = (value: ElementEntitySubType): value is cd.IImageProperties => {
  return value.elementType === cd.ElementEntitySubType.Image;
};

export const isIcon = (value: ElementEntitySubType): value is cd.IIconProperties => {
  return value.elementType === cd.ElementEntitySubType.Icon;
};

export const isButton = (value: ElementEntitySubType): value is cd.IButtonProperties => {
  return value.elementType === cd.ElementEntitySubType.Button;
};

export const isText = (value: ElementEntitySubType): value is cd.ITextProperties => {
  return value.elementType === cd.ElementEntitySubType.Text;
};

export const isSymbolDefinition = (value: ElementEntitySubType): value is cd.ISymbolProperties => {
  return value.elementType === cd.ElementEntitySubType.Symbol;
};

export const isSymbolInstance = (
  value: ElementEntitySubType
): value is cd.ISymbolInstanceProperties => {
  return value.elementType === cd.ElementEntitySubType.SymbolInstance;
};

export const isSymbol = (element: ElementEntitySubType): boolean => {
  return isSymbolDefinition(element) || isSymbolInstance(element);
};

export const isRootSubtype = (type: cd.ComponentIdentity): boolean => {
  return type === cd.ElementEntitySubType.Board || type === cd.ElementEntitySubType.Symbol;
};

export const isRoot = (value: ElementEntitySubType): value is cd.IRootElementProperties => {
  return isRootSubtype(value.elementType);
};

export const isRootInstance = (element: cd.PropertyModel): boolean => {
  return isSymbolInstance(element) || isBoardPortal(element);
};

export const isPortalParent = ({ elementType }: ElementEntitySubType): boolean => {
  return (
    elementType === cd.ElementEntitySubType.Tabs ||
    elementType === cd.ElementEntitySubType.Stepper ||
    elementType === cd.ElementEntitySubType.ExpansionPanel
  );
};

export const isElement = (model: cd.IProjectContentDocument): model is cd.PropertyModel => {
  return model.type === cd.EntityType.Element;
};

export const isCodeComponent = (
  model: cd.IProjectContentDocument
): model is cd.ICodeComponentDocument => {
  return model.type === cd.EntityType.CodeComponent;
};

export const checkForRoots = (
  ids: Set<string>,
  elementProperties: cd.ElementPropertiesMap
): boolean =>
  [...ids].some((id) => {
    const props = elementProperties[id];
    return props && isRoot(props);
  });

/** check if any element is a board */
export const hasBoards = (models: cd.ReadOnlyPropertyModelList): boolean =>
  models.some((m) => isBoard(m));

/** returns true if any of the property models are a board or a symbol definition */
export const hasRoots = (models: cd.ReadOnlyPropertyModelList): boolean => {
  return models.some((m) => isSymbolDefinition(m) || isBoard(m));
};

/** Checks if element has childIds */
export const hasChildren = (id: string, props: cd.ElementPropertiesMap): boolean => {
  const length = props[id]?.childIds?.length;
  return length !== undefined && length > 0;
};

// Utility function to either filter out root ids or filter to only keep root ids
export const filterRoots = (
  ids: string[],
  elementProperties: cd.ElementPropertiesMap,
  keepBoards: boolean
): string[] => {
  return ids.filter((id) => {
    const props = elementProperties[id];
    return props && keepBoards === isRoot(props);
  });
};

export const filterBoardsList = (
  models: cd.ReadOnlyPropertyModelList,
  keepBoards: boolean
): cd.ReadOnlyPropertyModelList => {
  return models.filter((model) => keepBoards === isBoard(model));
};

export const getRootIds = (
  ids: Set<string>,
  elementProperties: cd.ElementPropertiesMap
): Set<string> => {
  return Array.from(ids).reduce((acc, id) => {
    const props = elementProperties[id];
    if (props) {
      acc.add(props.rootId);
    }
    return acc;
  }, new Set<string>());
};

export const mergeUpdatesIntoProperties = (
  elementProperties: cd.ElementPropertiesMap,
  updates: cd.IPropertiesUpdatePayload[]
): cd.ElementPropertiesMap => {
  const updatedProps = { ...elementProperties };
  for (const update of updates) {
    const { elementId, properties } = update;
    const currentProperites = updatedProps[elementId];
    const mergedProperties = { ...currentProperites, ...properties } as cd.PropertyModel;
    updatedProps[elementId] = mergedProperties;
  }
  return updatedProps;
};

/**
 * Categorize elements ids by their board id
 */
export const categorizeElementsByBoard = (
  elements: cd.PropertyModel[]
): ReadonlyMap<string, cd.PropertyModel[]> =>
  elements.reduce((prevMap, currItem) => {
    const { rootId } = currItem;
    const prev = prevMap.get(rootId);
    if (prev) {
      prev.push(currItem);
    } else {
      prevMap.set(rootId, [currItem]);
    }
    return prevMap;
  }, new Map());

/**
 * Sort position in this fashion (from top to bottom, from shallow to deep):
 * 0,1 -> 0,2 -> 0,2,0 -> 0,3 -> 0,4 -> 0,4,0 -> 0,4,1 -> 0,5 -> 0,10 -> 0,20
 * This streamlines multi-element template manipulation for certain IDropLocation usage
 * and for discovering ancestors/descendents in a collection of hierarchyLocations.
 */

const comparePositions = (aPos: number[], bPos: number[]): number => {
  let i = 0;
  while (aPos[i] !== undefined || bPos[i] !== undefined) {
    if (aPos[i] === undefined && bPos[i] !== undefined) return -1;
    if (aPos[i] !== undefined && bPos[i] === undefined) return 1;
    if (aPos[i] !== bPos[i]) return aPos[i] - bPos[i];
    i++;
  }
  return 0;
};

const recursivePositionForElement = (
  element: cd.PropertyModel,
  propertiesMap: cd.ElementPropertiesMap,
  position: number[] = []
): number[] => {
  const parentElement = element.parentId && propertiesMap[element.parentId];
  if (parentElement) {
    const positionIdx = parentElement.childIds.indexOf(element.id);
    const parentPositions = recursivePositionForElement(parentElement, propertiesMap);
    position = [...position, ...parentPositions, positionIdx];
  }
  return position;
};

/**
 * Given a list of element properties
 * generate a map of position hierarchy based on the index of childIds of elements
 * @example
 * {
 *  some_root:{ childIds:['bar', 'foo'] }, // ROOT
 *  foo:{ childIds:['child_of_foo'], parentId:'some_root' }, // [1]
 *  child_of_foo:{ childIds:[], parentId: 'foo' }, // [1,0]
 *  bar:{ childIds:[], parentId:'some_root' } // [0]
 * }
 */
export const buildPositionMapForElements = (
  elements: cd.ReadOnlyPropertyModelList,
  propertiesMap: cd.ElementPropertiesMap
): Map<string, number[]> => {
  return elements.reduce<Map<string, number[]>>((positions, element) => {
    const position = recursivePositionForElement(element, propertiesMap);
    positions.set(element.id, position);
    return positions;
  }, new Map());
};

export const sortElementsByPosition = (
  elements: cd.ReadOnlyPropertyModelList,
  positionMap: Map<string, number[]>
): cd.ReadOnlyPropertyModelList => {
  return [...elements].sort((a, b) => {
    const positionA = positionMap.get(a.id) || [];
    const positionB = positionMap.get(b.id) || [];
    return comparePositions(positionA, positionB);
  });
};

/**
 * - Used to get root elements on symbol create
 * - On drag, filter out any children when a parent is selected
 * - On copy/paste insert only root elements of what was copied
 * */
const filterOutDescendents = (
  sortedElements: cd.ReadOnlyPropertyModelList,
  positionMap: Map<string, number[]>
): cd.ReadOnlyPropertyModelList => {
  const { length } = sortedElements;
  if (length === 0) return [];

  const [first] = sortedElements;
  const firstPosition = positionMap.get(first.id) || [];
  let currentAncestorPositionStr: string = firstPosition.join();

  const filteredElements: cd.PropertyModel[] = [first];

  for (let i = 1; i < length; i++) {
    const element = sortedElements[i];
    const elementPosition = positionMap.get(element.id) || [];
    const elementPositionStr = elementPosition.join();

    const str = `${currentAncestorPositionStr},`;
    if (elementPositionStr.startsWith(str)) {
      // it's a descendent, don't include in in the ret
      continue;
    }
    // it's a new ancestor, so include it and begin looking for its descendents
    filteredElements.push(element);
    currentAncestorPositionStr = elementPositionStr;
  }

  return filteredElements;
};

/**
 * Takes an array of elements and sorts it first by board and then by position
 * Also, filters out any decendants
 */
export const sortAndFilterElements = (
  elements: cd.PropertyModel[],
  propertiesMap: cd.ElementPropertiesMap
): cd.PropertyModel[] => {
  const elementsByBoard = categorizeElementsByBoard(elements).values();
  const positionMap = buildPositionMapForElements(elements, propertiesMap);
  const result: cd.PropertyModel[] = [];
  for (const boardElements of elementsByBoard) {
    const sortedElements = sortElementsByPosition(boardElements, positionMap);
    const filteredElements = filterOutDescendents(sortedElements, positionMap);
    result.push(...filteredElements);
  }

  return result;
};

/**
 * Determine if the destination position is a child of the src position
 * This equates to the source and destination being on the same board,
 * and the src position is contained in the dest position
 *
 * e.g.
 * src 0,1  dest 0,1,0 => true
 * src 0    dest 0     => true
 * src 0,1  dest 0     => false
 */
const isDestChildOfSrc = (
  element: cd.PropertyModel,
  destBoardId: string,
  destPosition: number[],
  positionMap: Map<string, number[]>
): boolean => {
  const { rootId, id } = element;
  if (rootId !== destBoardId) return false;
  const position = positionMap.get(id);
  if (!position) return false;
  // if dest position array is shorter, then it cannot be contained in src
  if (position.length > destPosition.length) return false;
  // if all of src is contained in dest, return true. if their are any mismatches return false;
  return position.every((value, i) => value === destPosition[i]);
};

/** Is this elementId contained within the dragIds?  */
export const isElementChildOfItems = (
  elementId: string,
  dragIds: string[],
  elementProperties: cd.ElementPropertiesMap
): boolean => {
  const props = elementProperties[elementId];
  if (props === undefined) return false;
  const dragProps = lookupElementIds(dragIds, elementProperties);
  const positionMap = buildPositionMapForElements([props, ...dragProps], elementProperties);
  const { rootId } = props;
  const position = positionMap.get(elementId);
  if (!position) return false;
  return dragProps.some((item) =>
    item ? isDestChildOfSrc(item, rootId, position, positionMap) : false
  );
};

export const mergeUpdates = (
  updates: cd.IPropertiesUpdatePayload[]
): cd.IPropertiesUpdatePayload[] => {
  type PropertyMap = cd.IStringMap<cd.IPropertiesUpdatePayload>;
  return Object.values(
    updates.reduce<PropertyMap>((merged, update) => {
      const { elementId, properties } = update;
      const prev = merged[elementId];
      const props = prev ? { ...prev.properties, ...properties } : properties;
      merged[elementId] = { elementId, properties: props as Partial<cd.PropertyModel> };
      return merged;
    }, {})
  );
};

export const getActiveStyleFromProperty = (
  prop: cd.PropertyModel,
  activeStyle = cd.State.Default
): cd.IStyleDeclaration | undefined => {
  return prop.styles?.[activeStyle]?.style;
};

export const getAllIdsDepthFirst = (
  props: cd.ElementPropertiesMap,
  rootIds: string[]
): string[] => {
  return rootIds.reduce((acc: string[], currId) => {
    const currProps = props[currId];
    if (!currProps) return acc;
    return [...acc, currId, ...getAllIdsDepthFirst(props, currProps.childIds)];
  }, []);
};

/** Returns a flattened list of all properties and groups for a component. */
export const getPropsRecursive = (props: cd.IPropertyGroup[]): cd.IPropertyGroup[] => {
  return props.reduce<cd.IPropertyGroup[]>((flattened, prop) => {
    flattened.push(prop);
    if (prop.children?.length) {
      flattened = [...flattened, ...getPropsRecursive(prop.children)];
    }
    return flattened;
  }, []);
};

/** Returns a map of property names to properties for quick access. */
export const getPropertyMap = (props: cd.IPropertyGroup[]): Record<string, cd.IProperty> => {
  const allProps = getPropsRecursive(props);
  return allProps.reduce<Record<string, cd.IProperty>>((map, prop) => {
    if (prop.name) {
      map[prop.name] = prop;
    }
    return map;
  }, {});
};

/** Recursively check through properties to determine if any Portal slots are used */
export const propsContainPortalSlot = (props: cd.IPropertyGroup[]): boolean => {
  const allProps = getPropsRecursive(props);
  return allProps.some((prop) => {
    const { inputType, schema } = prop;
    if (inputType === cd.PropertyInput.PortalSlot) return true;
    if (inputType === cd.PropertyInput.DynamicList && schema) return propsContainPortalSlot(schema);
    return false;
  });
};

const BOOLEAN_INPUT_TYPES = [cd.PropertyInput.Checkbox, cd.PropertyInput.Toggle];

/**
 * Returns true if property holds a boolean type.  Attempts a best guess as
 * to whether it's a boolean since we don't explicitly assign types to properties.
 */
export const isBooleanProperty = (prop: cd.IProperty): boolean => {
  return (
    BOOLEAN_INPUT_TYPES.includes(prop.inputType as cd.PropertyInput) ||
    prop.coerceType === cd.CoerceValue.Boolean ||
    isBoolean(prop.defaultValue)
  );
};

const NUMBER_INPUT_TYPES = [
  cd.PropertyInput.Number,
  cd.PropertyInput.Integer,
  cd.PropertyInput.PercentRange,
  cd.PropertyInput.Range,
];

/**
 * Returns true if property holds a number type.  Attempts a best guess as
 * to whether it's a number since we don't explicitly assign types to properties.
 */
export const isNumberProperty = (prop: cd.IProperty): boolean => {
  return (
    NUMBER_INPUT_TYPES.includes(prop.inputType as cd.PropertyInput) ||
    prop.coerceType === cd.CoerceValue.Number ||
    isNumber(prop.defaultValue)
  );
};

/** Given an elementId, return a list of all nested childIds*/
export const getAllChildIdsRecursive = (
  elementId: string,
  props: cd.ElementPropertiesMap,
  includeParent = true // Should include the elementId
): ReadonlyArray<string> => {
  const element = props[elementId];
  const idList: string[] = includeParent ? [elementId] : [];
  const childIds = element?.childIds || [];
  if (childIds.length) {
    const ids = childIds.flatMap((childId) => getAllChildIdsRecursive(childId, props));
    if (ids.length) idList.push(...ids);
  }
  return idList;
};
