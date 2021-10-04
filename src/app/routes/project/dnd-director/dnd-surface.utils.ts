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

import { ReadonlyRenderResultsExArray } from './dnd-interfaces';
import { createPoint, IPoint } from 'cd-utils/geometry';
import { getAllChildIdsRecursive } from 'cd-common/models';
import * as cd from 'cd-interfaces';

/**
 * Returns an array of elements who are similar
 * and a list of all children ids to ignore
 */
export type SimilarDragElements = [
  similar: ReadonlyRenderResultsExArray,
  children: ReadonlyArray<string>
];

/** Distance from point to rectangle */
export const distanceToRect = (pt: IPoint, rect: cd.IRect) => {
  const { x: px, y: py } = pt;
  const { x, y, width, height } = rect;
  const cx = Math.max(Math.min(px, x + width), x);
  const cy = Math.max(Math.min(py, y + height), y);
  return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
};

/** Is point inside rectangle */
export const insideRect = (pt: IPoint, rect: cd.IRect) => {
  const { x, y, width, height } = rect;
  return x <= pt.x && pt.x <= x + width && y <= pt.y && pt.y <= y + height;
};

/** Given a rectangle, shave off the edge by X amount and adjust dimensions */
export const trimRectEdge = (rect: cd.IRect, edge = 3): cd.IRect => {
  const doubleEdge = edge * 2;
  const x = rect.x + edge;
  const y = rect.y + edge;
  const width = rect.width - doubleEdge;
  const height = rect.height - doubleEdge;
  return { x, y, width, height };
};

/** Used to divide a rectangle in half and detect which half you're on */
export const sign = (p1: IPoint, p2: IPoint, p3: IPoint): number => {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

export const areRectsTheSameSize = (a: cd.IRect, b: cd.IRect): boolean => {
  return a.height === b.height && a.width === b.width;
};

export const areRectsTheSameWidthOrHeight = (a: cd.IRect, b: cd.IRect): boolean => {
  return a.height === b.height || a.width === b.width;
};

export const isSecondRectSmaller = (first: cd.IRect, second: cd.IRect): boolean => {
  return first.height * first.width > second.height * second.width;
};

/**
 * Looksup + creates an array of property models based on ids
 */
export const getPropsArrayFromIds = (
  ids: ReadonlyArray<string>,
  props: cd.ElementPropertiesMap
): cd.ReadOnlyPropertyModelList => {
  return ids.reduce<cd.PropertyModel[]>((acc, id) => {
    const elem = id in props && props[id];
    if (elem) acc.push(elem);
    return acc;
  }, []);
};

/**
 * Look at the children and build a string from their type
 * i.e GenericTextIconImage to forms a pattern to check against drag items
 */
export const getChildPattern = (id: string, props: cd.ElementPropertiesMap): string => {
  const children = getAllChildIdsRecursive(id, props);
  return children.map((childId) => props?.[childId]?.elementType).join('');
};

/** create pattern from drag items */
export const buildChildPattern = (ids: ReadonlyArray<string>, props: cd.ElementPropertiesMap) => {
  const dragElements = getPropsArrayFromIds(ids, props);
  return dragElements.reduce((acc, { id }) => {
    acc.set(id, getChildPattern(id, props));
    return acc;
  }, new Map());
};

/**
 * Takes booleans converts to numbers, adds them up
 */
export const addWeights = (...weights: (boolean | undefined)[]): number => {
  return weights.reduce<number>((acc, curr) => {
    acc += Number(curr);
    return acc;
  }, 0);
};

/**
 * A set of rules to find similar elements
 * to the user is dragging
 */
export const filterRectsByWeight = (
  rects: ReadonlyRenderResultsExArray,
  props: cd.ElementPropertiesMap,
  dragRect: cd.IRenderResult | undefined,
  dragChildCount: number,
  dragChildPattern: string,
  minWeight: number
): ReadonlyRenderResultsExArray => {
  if (!dragRect) return [];
  const { width: dragWidth, height: dragHeight } = dragRect.frame;
  const dragArea = dragHeight * dragWidth;
  return rects.filter(({ id, frame }) => {
    const { width, height } = frame;
    const childCount = props[id]?.childIds.length || 0;
    const sameChildCount = childCount === dragChildCount;
    const childPattern = (sameChildCount && getChildPattern(id, props)) || '';
    const childPatternWt = !!childPattern && childPattern === dragChildPattern;
    const childArea = height * width;
    const childAreaRatio = dragArea / childArea;
    const childAreaWt = childAreaRatio > 1;
    const widthWt = width === dragWidth;
    const heightWt = height === dragHeight;
    const weight = addWeights(widthWt, heightWt, sameChildCount, childPatternWt, childAreaWt);
    return weight > minWeight;
  });
};

/** Converts x and y based on current canvas position */
export const convertCursorForCanvas = (pt: IPoint, canvas: cd.ICanvas): IPoint => {
  const { x, y, z } = canvas.position;
  const cx = (pt.x - x) / z;
  const cy = (pt.y - y) / z;
  return createPoint(cx, cy);
};

/** Element rects live inside boards, this converts to a global point  */
export const adjustFrameByRoot = (frame: cd.IRect, root: cd.IRect): cd.IRect => {
  const { width, height } = frame;
  const x = root.x + frame.x;
  const y = root.y + frame.y;
  return { x, y, width, height };
};

/** We need to apply the board coordinates to the rects inside */
export const adjustedRectsForElementByRoot = (
  rects: ReadonlyRenderResultsExArray,
  root: cd.IRenderResult
): ReadonlyRenderResultsExArray => {
  return rects.map((item) => {
    if (root.id === item.id) return item;
    const frame = adjustFrameByRoot(item.frame, root.frame);
    return { ...item, frame };
  });
};

const depthForElement = (
  element: cd.PropertyModel,
  propsMap: cd.ElementPropertiesMap,
  level = 0
): number => {
  const parent = element.parentId && propsMap[element.parentId];
  return parent ? depthForElement(parent, propsMap, level + 1) : level;
};

/**
 * We need to sort elements by parent / child relation to know
 * which rectangles are closest to the cursor
 */
export const sortElementsByDepth = (
  props: cd.ReadOnlyPropertyModelList,
  _rootId: string,
  propsMap: cd.ElementPropertiesMap
): cd.ReadOnlyPropertyModelList => {
  return props
    .map((prop) => {
      const level = depthForElement(prop, propsMap);
      return { ...prop, level };
    })
    .sort((a, b) => b.level - a.level);
};

export const bottomLeftTopRightFromRect = (
  rect: cd.IRect
): [bottomLeft: IPoint, topRight: IPoint] => {
  const { x, width, y, height } = rect;
  const topRight = createPoint(x + width, y);
  const bottomLeft = createPoint(x, y + height);
  return [bottomLeft, topRight];
};

export const isCursorBeforeOrAfterDiagInRect = (mousePos: IPoint, rect: cd.IRect): boolean => {
  const [bl, tr] = bottomLeftTopRightFromRect(rect);
  // Which diagonal half of the rect are you on?
  const divide = sign(mousePos, tr, bl);
  return divide > 0;
};

export const closestRectToPoint = (
  pt: IPoint,
  rects: ReadonlyArray<cd.IRenderResult>,
  active?: cd.IRenderResult
): cd.IRenderResult | undefined => {
  let shortest = Number.MAX_SAFE_INTEGER;
  let closest = active;
  for (const rect of rects) {
    const dist = distanceToRect(pt, rect.frame);
    if (dist < shortest) {
      shortest = dist;
      closest = rect;
    }
  }
  return closest || active;
};
