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

import { createInstance, insertElements, StyleFactory } from 'cd-common/models';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { deepCopy } from 'cd-utils/object';
import { cssProperties } from 'cd-metadata/css';
import { toCamelCase } from 'cd-utils/string';
import { KEYS } from 'cd-utils/keycodes';
import { createId } from 'cd-utils/guid';
import * as utils from 'cd-common/utils';
import * as cd from 'cd-interfaces';
import { convertPropsUpdateToUpdateChanges, createElementChangePayload } from 'cd-common/utils';

/**
 * Given an array of propertyModels determine if any are visible
 * @param propertyModels
 */
export const areAnyElementsVisible = (propertyModels: cd.PropertyModel[]) => {
  return propertyModels.some((model) => model.inputs && model.inputs.hidden === false);
};

/**
 * Merges two CSS override arrays together, taking the newer value if there is a collision
 */
const mergeStyleOverrides = (
  oldOverrides: cd.IKeyValue[] = [],
  newOverrides: cd.IKeyValue[] = []
): cd.IKeyValue[] => {
  const newOverridesMap = utils.convertKeyValuesToMap(newOverrides);
  return oldOverrides.map((kv) => (kv.name in newOverridesMap ? newOverridesMap[kv.name] : kv));
};

/**
 * Creates a new element and carries over base styles and overrides. If `mergeStyleOverrides === true`,
 * overrides are merged together instead of just taking the new set of overrides.
 *
 * @param oldElement - The element that is being replaced
 * @param newElement - The new element to replace the old one
 * @param mergeStyleOverrides - Whether or not the overrides should be merged together, or just taking the new set.
 */
export const replaceElementAndPreserveRelevantProperties = (
  oldElement: cd.PropertyModel,
  newElement: cd.PropertyModel,
  mergeOverrides = true
) => {
  const { attrs, styles: oldStyles } = oldElement;
  const { base } = oldStyles;
  const { overrides: oldOverrides } = base;
  const positionStyles = utils.getPositionPropsFromStyles(base.style);

  const newElementCopy = deepCopy(newElement);
  const { styles: newStyles } = newElementCopy;
  const { base: newBase } = newStyles;
  const newBaseStyle = newBase.style || {};
  const newBaseOverrides = newBase.overrides || [];

  const overrides = mergeOverrides
    ? mergeStyleOverrides(oldOverrides, newBaseOverrides)
    : newBaseOverrides;

  const styles = new StyleFactory()
    .addBaseStyle({ ...newBaseStyle, ...positionStyles })
    .addBaseOverrides(overrides)
    .build();

  return { ...newElementCopy, attrs, styles };
};

export const getSiblingIdOrParent = (
  id: string,
  pid: string,
  siblings: string[],
  ignore: string[]
): string => {
  const idx = siblings.indexOf(id);
  const available = removeValueFromArrayAtIndex(idx, siblings);
  if (available.length === 0) return pid;
  let nextIdx = idx - 1;
  if (nextIdx < 0) nextIdx = 0;
  let sib = available[nextIdx];
  while (ignore.indexOf(sib) !== -1) {
    nextIdx--;
    sib = available[nextIdx];
  }
  return sib;
};

/**
 * Filters a `style` object from an `IStyleGroup` and returns the resulting object. Can include
 * AND/OR exclude keys from the resulting object.
 *
 * NOTE: The keys should be in the format that would be true css. For example, use `z-index` instead
 * of `zIndex`.
 *
 * @param style - The style object to filter
 * @param excludeKeys - Keys to be excluded from the returned object
 * @param includeKeys - Keys to be included from the returned object
 */
export const filterStyles = (
  style?: cd.IStyleDeclaration,
  excludeKeys: string[] = [],
  includeKeys: string[] = []
): cd.IStyleDeclaration | undefined => {
  if (!style) return;
  const camelCaseExcludes = excludeKeys.map(toCamelCase);
  const camelCaseIncludes = includeKeys.map(toCamelCase);
  const baseStyleEntries = Object.entries(style);

  const filteredEntries = baseStyleEntries.filter(([key]) => {
    const camelCaseKey = toCamelCase(key);
    const notExcluded = !camelCaseExcludes.includes(camelCaseKey);
    if (notExcluded && includeKeys.length > 0) {
      return camelCaseIncludes.includes(camelCaseKey);
    }
    return notExcluded;
  });

  return Object.fromEntries(filteredEntries);
};

// prettier-ignore
const CSS_BORDER_KEY = 'border';
const CSS_SHADOW_KEY = 'shadow';
const CSS_ZINDEX_KEY = 'z-index';
const EXCLUDED_BOARD_CSS = [
  'width',
  'height',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  CSS_ZINDEX_KEY,
];

const filterCSSPropertiesForKey = (key: string) => {
  return cssProperties.filter((prop) => prop.includes(key));
};

/**
 * Create a new board from the old element. Should include filtered `style` object of base styles,
 * full overrides object, and all other non-base styles
 */
export const createBoardFromElement = (
  frame: cd.IRect,
  projectId: string,
  element: cd.PropertyModel
): cd.IBoardProperties => {
  const boardFrame = utils.removePtFromOutletFrame(frame);
  const boardId = createId();
  const boardFactory = createInstance(cd.ElementEntitySubType.Board, projectId, boardId)
    .assignFrameFromFrame(boardFrame)
    .assignRootId(boardId);

  const { base: oldBase, ...rest } = element.styles;
  const { style: oldStyle, overrides } = oldBase;
  const borderProperties = filterCSSPropertiesForKey(CSS_BORDER_KEY);
  const shadowProperties = filterCSSPropertiesForKey(CSS_SHADOW_KEY);
  const excludeKeys = [...borderProperties, ...shadowProperties, ...EXCLUDED_BOARD_CSS];
  const style = filterStyles(oldStyle, excludeKeys);
  const base = { style, overrides };

  boardFactory.assignStyles({ ...rest, base });

  return boardFactory.build();
};

const CSS_OVERFLOW_KEY = 'overflow';

/**
 * Create a new portal to replace the old element. Should point to the newly created
 * board (`referenceId`), stay the same width/height of the old element, keep overflow properties,
 * and maintain z-index.
 */
export const createPortal = (
  projectId: string,
  referenceId: string,
  frame: cd.IRect,
  element: cd.PropertyModel
): cd.IBoardPortalProperties => {
  const portalId = createId();
  const portalFactory = createInstance(cd.ElementEntitySubType.BoardPortal, projectId, portalId);

  const overflowProperties = filterCSSPropertiesForKey(CSS_OVERFLOW_KEY);
  const includeKeys = [...overflowProperties, CSS_ZINDEX_KEY];

  const { styles } = element;
  const { base: baseStyleGroup } = styles;
  const style = filterStyles(baseStyleGroup.style, undefined, includeKeys);
  if (style) {
    const base = { style };
    portalFactory.assignStyles({ base });
  }

  portalFactory.addInputs({ referenceId }).assignWidth(frame.width).assignHeight(frame.height);

  return portalFactory.build();
};

export const moveElementsRelative = (
  elementProperties: cd.ElementPropertiesMap,
  element: cd.PropertyModel,
  evt: KeyboardEvent
): cd.IElementChangePayload[] => {
  const { id, parentId } = element;
  const parent = parentId && elementProperties[parentId];
  if (!parent) return [];
  const upConfig: string[] = [KEYS.ArrowLeft, KEYS.ArrowUp];
  const moveUp = upConfig.includes(evt.key);
  const idx = parent.childIds.indexOf(id);
  const len = parent.childIds.length;
  if (len === 1) return [];
  const increment = moveUp ? -1 : 1;
  const position = idx + increment;
  const target = moveUp ? (position === -1 ? len - 1 : position) : position % len;
  const dropTargetId = parent.childIds[target];
  const after = moveUp ? target === len - 1 : target !== 0;
  const relation = after ? cd.InsertRelation.After : cd.InsertRelation.Before;
  const dropLocation = { relation, elementId: dropTargetId };
  const update = insertElements([id], dropLocation, elementProperties);
  return [update];
};

export const moveElementsAbsolute = (
  element: cd.PropertyModel,
  evt: KeyboardEvent,
  shiftIncrement = 10,
  defaultIncrement = 1
): cd.IElementChangePayload[] => {
  const baseStyle = utils.getElementBaseStyles(element);
  if (!baseStyle) return [];
  const { key, shiftKey } = evt;
  const increment = shiftKey ? shiftIncrement : defaultIncrement;
  const keyUp = key === KEYS.ArrowUp;
  const keyDown = key === KEYS.ArrowDown;
  const keyLeft = key === KEYS.ArrowLeft;
  const keyRight = key === KEYS.ArrowRight;

  const upOrDown = keyUp || keyDown;
  const leftOrRight = keyLeft || keyRight;
  const decrement = keyUp || keyLeft;
  const move = decrement ? increment * -1 : increment;
  const style: cd.IStyleDeclaration = {};

  if (upOrDown) {
    const unsetVert = [cd.Position.Top, cd.Position.Bottom];
    const top = calculatePosition(baseStyle, cd.Position.Top, move, 1, unsetVert);
    const bottom = calculatePosition(baseStyle, cd.Position.Bottom, move, -1);
    Object.assign(style, { top, bottom });
  }

  if (leftOrRight) {
    const unsetHorz = [cd.Position.Left, cd.Position.Right];
    const left = calculatePosition(baseStyle, cd.Position.Left, move, 1, unsetHorz);
    const right = calculatePosition(baseStyle, cd.Position.Right, move, -1);
    Object.assign(style, { left, right });
  }

  const update = utils.buildBaseStylePropsUpdate(element.id, style);
  const updateChanges = convertPropsUpdateToUpdateChanges([update]);
  const payload = createElementChangePayload(undefined, updateChanges);
  return [payload];
};

const calculatePosition = (
  baseStyles: cd.IStyleDeclaration,
  key: string,
  move: number,
  direction: number,
  edges: string[] = []
): cd.IValue | null => {
  const hasEdges = edges.length ? arePositionEdgesSet(baseStyles, edges) : true;
  const canMove = !hasEdges || baseStyles?.[key];
  if (!canMove) return null;
  const position = baseStyles?.[key]?.value ?? 0;
  const value = Number(position) + move * direction;
  return utils.createPixelIValue(value);
};
/** Looks to see if any position props are applied to the element style */
const arePositionEdgesSet = (baseStyle: cd.IStyleDeclaration, edges: string[]): boolean => {
  return edges.some((key) => key in baseStyle);
};

export const hasRelativePosition = (element: cd.PropertyModel): boolean => {
  return utils.getElementBaseStyles(element)?.position === cd.PositionType.Relative;
};
