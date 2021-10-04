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

import {
  getElementBaseStyles,
  buildBaseStylePropsUpdate,
  assignBaseStyles,
  createPixelIValue,
  generateFrame,
  convertPropsUpdateToUpdateChanges,
  createElementChangePayload,
} from 'cd-common/utils';
import * as cd from 'cd-interfaces';

/**
 * Look up a rect by id w/ fallback values
 */
export const lookupRectWithFallback = (
  id: string | undefined,
  renderRects: cd.RenderRectMap
): cd.IRect => {
  const rect = id && renderRects.get(id)?.frame;
  return rect || generateFrame();
};

/**
 * Given a list of elements,
 * generate a bounding box from their renderRects
 */
export const boundingBoxFromElements = (
  elements: cd.ReadOnlyPropertyModelList,
  renderRects: cd.RenderRectMap
): cd.IRect => {
  let minX = Number.MAX_SAFE_INTEGER;
  let maxX = Number.MIN_SAFE_INTEGER;
  let minY = Number.MAX_SAFE_INTEGER;
  let maxY = Number.MIN_SAFE_INTEGER;

  for (const element of elements) {
    const frame = lookupRectWithFallback(element.id, renderRects);
    const { x, y, width: w, height: h } = frame;
    const right = x + w;
    const bottom = y + h;
    if (!minX || x < minX) minX = x;
    if (!minY || y < minY) minY = y;
    if (!maxX || right > maxX) maxX = right;
    if (!maxY || bottom > maxY) maxY = bottom;
  }

  const width = maxX - minX;
  const height = maxY - minY;

  return generateFrame(minX, minY, width, height);
};

/** Offset rect based on parent rectangle */
export const generateBoundingBox = (
  id: string | undefined,
  elements: cd.ReadOnlyPropertyModelList,
  renderRects: cd.RenderRectMap
): cd.IRect => {
  const frame = boundingBoxFromElements(elements, renderRects);
  const parentRect = lookupRectWithFallback(id, renderRects);
  const { width, height } = frame;
  const x = frame.x - parentRect.x;
  const y = frame.y - parentRect.y;
  return generateFrame(x, y, width, height);
};

const positionOffset = (value: number | null, offset = 0) => {
  if (value === null || value === undefined) return null;
  return createPixelIValue(value - offset);
};

/**
 * Given an element generate a properties update for
 * position properties: top, left, bottom, right
 */
const rectStylePayload = (
  el: cd.PropertyModel,
  t?: number,
  l?: number,
  b?: number,
  r?: number
): cd.IPropertiesUpdatePayload => {
  const baseStyles = getElementBaseStyles(el);
  const top = positionOffset(baseStyles?.top?.value, t);
  const left = positionOffset(baseStyles?.left?.value, l);
  const bottom = positionOffset(baseStyles?.bottom?.value, b);
  const right = positionOffset(baseStyles?.right?.value, r);
  // We apply fixed position to the parent so all child elements should be absolute
  const allNull = [top, left, bottom, right].every((item) => item === null);
  const pos = allNull ? {} : { position: cd.PositionType.Absolute };
  const style = { top, left, bottom, right, ...pos };
  return buildBaseStylePropsUpdate(el.id, style);
};

/** when all elements inside a group are absolute, we take the dimensions and apply that to the group  */
export const applyAbsolutePositionToGroup = (
  element: cd.IGenericProperties | cd.ISymbolInstanceProperties,
  frame: cd.IRect,
  hasFixed: boolean
) => {
  const width = createPixelIValue(frame.width);
  const height = createPixelIValue(frame.height);
  const top = createPixelIValue(frame.y);
  const left = createPixelIValue(frame.x);
  const position = hasFixed ? cd.PositionType.Fixed : cd.PositionType.Absolute;
  assignBaseStyles(element, { width, height, top, left, position });
};

/**
 * Adjust the offset position of all children based on the bounds
 * created from those children
 */
export const adjustAbsolutePositionForChildren = (
  bounds: cd.IRect,
  elements: cd.ReadOnlyPropertyModelList,
  renderRects: cd.RenderRectMap
): ReadonlyArray<cd.IPropertiesUpdatePayload> => {
  const { x: left, y: top, width, height } = bounds;
  const groupBottom = top + height;
  const groupRight = left + width;
  return elements.map((item) => {
    const parentRect = lookupRectWithFallback(item.parentId, renderRects);
    const bottom = parentRect.height - groupBottom;
    const right = parentRect.width - groupRight;
    return rectStylePayload(item, top, left, bottom, right);
  });
};

const frameFromStylesWithFallback = (element: cd.PropertyModel, frame: cd.IRect | undefined) => {
  const styles = getElementBaseStyles(element);
  const x = styles?.left?.value ?? frame?.x ?? 0;
  const y = styles?.top?.value ?? frame?.y ?? 0;
  const width = styles?.width?.value ?? frame?.width ?? 0;
  const height = styles?.height?.value ?? frame?.height ?? 0;
  const right = styles?.right?.value ?? x + width;
  const bottom = styles?.bottom?.value ?? y + height;
  return { x, y, width, height, right, bottom };
};

export const ungroupAbsolutePositionChildren = (
  element: cd.PropertyModel,
  elementProperties: cd.ElementPropertiesMap,
  renderRects: cd.RenderRectMap
): cd.IElementChangePayload => {
  const { id, parentId, childIds = [] } = element;
  const frame = renderRects.get(id)?.frame;
  const groupRect = frameFromStylesWithFallback(element, frame);
  const parentRect = lookupRectWithFallback(parentId, renderRects);
  const bottom = parentRect.height - groupRect.bottom;
  const right = parentRect.width - groupRect.right;

  // filter to child elements who have absolute position
  // and adjust their position based on the ungroup
  const updates = childIds
    .map((childId) => elementProperties[childId])
    .filter((child): child is cd.PropertyModel => !!child && elementsHaveAbsolutePosition([child]))
    .map((child) => rectStylePayload(child, -groupRect.y, -groupRect.x, -bottom, -right));

  const updateChanges = convertPropsUpdateToUpdateChanges(updates);
  const change = createElementChangePayload(undefined, updateChanges);
  return change;
};

export const elementsHaveAbsolutePosition = (elements: cd.ReadOnlyPropertyModelList): boolean => {
  return elements.every((el) => getElementBaseStyles(el)?.position !== cd.PositionType.Relative);
};

export const someElementsHaveFixedPosition = (elements: cd.ReadOnlyPropertyModelList): boolean => {
  return elements.some((el) => getElementBaseStyles(el)?.position === cd.PositionType.Fixed);
};
