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
import { createPoint, IPoint } from 'cd-utils/geometry';
import { UnitTypes } from 'cd-metadata/units';
import { DragMode } from './dnd-interfaces';
import { assignBaseStyles, createPixelIValue, getElementBaseStyles } from 'cd-common/utils';

const POSITION_STYLE = 'position';

const doOverridesIncludeAbsPosition = (overrides: cd.IKeyValue[] = []): boolean => {
  return overrides.some(({ name, value }) => {
    if (name !== POSITION_STYLE) return false;
    return value === cd.PositionType.Absolute || value === cd.PositionType.Fixed;
  });
};

/** Check the  dragIds for style position:absolute;  */
export const areAllDragElementsAbsolutePosition = (
  dragIds: ReadonlyArray<string>,
  props: cd.ReadonlyElementPropertiesMap
) => {
  return dragIds.every((id) => {
    const element = props[id];
    if (!element) return false;
    const baseStyles = element.styles.base;
    const hasAbsOverride = doOverridesIncludeAbsPosition(baseStyles.overrides);
    const position = baseStyles.style?.position;
    const positionIsntRelative = position && position !== cd.PositionType.Relative;
    // ( Absolute | Fixed ) | Relative
    return hasAbsOverride || positionIsntRelative;
  });
};

export const dragModeFromIds = (
  dragIds: ReadonlyArray<string>,
  props: cd.ReadonlyElementPropertiesMap
): DragMode => {
  const isAbsolute = areAllDragElementsAbsolutePosition(dragIds, props);
  return isAbsolute ? DragMode.Absolute : DragMode.Relative;
};

export const buildAbsPropertiesPartial = (
  elementId: string,
  rootId: string,
  style: cd.IStyleDeclaration
): cd.IPropertiesUpdatePayload[] => {
  const styles = { base: { style } };
  return [{ elementId, properties: { styles, rootId } }];
};

const calculateTop = (
  mousePos: IPoint,
  container: cd.IRect,
  element: cd.PropertyModel,
  empty = false
): cd.IValue | null => {
  if (!empty && !getElementBaseStyles(element)?.top) return null;
  const value = Math.round(mousePos.y - container.y);
  return createPixelIValue(value);
};

const calculateLeft = (
  mousePos: IPoint,
  container: cd.IRect,
  element: cd.PropertyModel,
  empty = false
): cd.IValue | null => {
  if (!empty && !getElementBaseStyles(element)?.left) return null;
  const value = Math.round(mousePos.x - container.x);
  return createPixelIValue(value);
};

const calculateBottom = (
  mousePos: IPoint,
  container: cd.IRect,
  element: cd.PropertyModel,
  elemRect?: cd.IRect
): cd.IValue | null => {
  if (!getElementBaseStyles(element)?.bottom) return null;
  const dragHeight = elemRect?.height || 0;
  const { y, height } = container;
  const value = Math.round(y + height - mousePos.y - dragHeight);
  return createPixelIValue(value);
};

const calculateRight = (
  mousePos: IPoint,
  container: cd.IRect,
  element: cd.PropertyModel,
  elemRect?: cd.IRect
): cd.IValue | null => {
  if (!getElementBaseStyles(element)?.right) return null;
  const dragWidth = elemRect?.width || 0;
  const { x, width } = container;
  const value = Math.round(x + width - mousePos.x - dragWidth);
  return createPixelIValue(value);
};

const POSITON_EDGES = [cd.Position.Top, cd.Position.Left, cd.Position.Bottom, cd.Position.Right];

/** Looks to see if any position props are applied to the element style */
const arePositionEdgesSet = (element: cd.PropertyModel): boolean => {
  const baseStyle = getElementBaseStyles(element);
  return baseStyle ? POSITON_EDGES.some((key) => key in baseStyle) : false;
};

export const calculateAbsoluteEdges = (
  mousePos: IPoint,
  container: cd.IRect,
  element: cd.PropertyModel,
  elemRect: cd.IRect | undefined
) => {
  const hasEdges = arePositionEdgesSet(element);
  const top = calculateTop(mousePos, container, element, !hasEdges);
  const left = calculateLeft(mousePos, container, element, !hasEdges);
  const right = calculateRight(mousePos, container, element, elemRect);
  const bottom = calculateBottom(mousePos, container, element, elemRect);
  return { top, left, bottom, right };
};

/**
 * offscreen start position is needed so the element doesnt flash on screen
 * for a half second
 */
const OFFSCREEN_START: cd.IValue = { value: -1000, units: UnitTypes.Pixels };

const INITAL_ABS_STATE = {
  position: cd.PositionType.Absolute,
  top: OFFSCREEN_START,
  left: OFFSCREEN_START,
};

export const processDragAddtions = (
  additions: cd.PropertyModel[] | undefined,
  prefersAbs: boolean
): cd.PropertyModel[] | undefined => {
  if (!prefersAbs || !additions) return additions;
  return additions.map((item) => {
    if (!!item.rootId) return item;
    assignBaseStyles(item, INITAL_ABS_STATE);
    return item;
  });
};

export const convertPropsArrayToMap = (
  props: cd.ReadOnlyPropertyModelList
): cd.ReadonlyElementPropertiesMap => {
  return props.reduce<cd.ElementPropertiesMap>((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});
};

/**
 * Given the mouse position (pt) and current dragged element's position (activeFrame)
 * adjust the multi-selected elements (dragFrame) with a delta offset
 */
export const offsetCursorFromDragRect = (
  pt: IPoint,
  activeFrame: cd.IRect,
  dragFrame?: cd.IRect
): IPoint => {
  if (!dragFrame) return pt;
  const deltaX = pt.x - (activeFrame.x - dragFrame.x);
  const deltaY = pt.y - (activeFrame.y - dragFrame.y);
  return createPoint(deltaX, deltaY);
};
