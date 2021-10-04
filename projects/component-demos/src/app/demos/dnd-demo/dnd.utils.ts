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

import { IRect } from 'cd-interfaces';
import { IPoint } from 'cd-utils/geometry';
import { IElement } from './dnd-interfaces';
import { mapFromArrayOfObjectsWithId } from 'cd-utils/map';

export const INSERTED_ID = 'inserted';

const insideRect = (pt: IPoint, { x, y, width, height }: IRect) => {
  return x <= pt.x && pt.x <= x + width && y <= pt.y && pt.y <= y + height;
};

export const trimRect = (rect: IRect, edge = 3): IRect => {
  const edge2 = edge * 2;
  const x = rect.x + edge;
  const y = rect.y + edge;
  const width = rect.width - edge2;
  const height = rect.height - edge2;
  return { x, y, width, height };
};

const distanceToRect = ({ x: px, y: py }: IPoint, { x, y, width, height }: IElement) => {
  const cx = Math.max(Math.min(px, x + width), x);
  const cy = Math.max(Math.min(py, y + height), y);
  return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
};

export const findClosestElement = (
  list: IElement[],
  mousePos: IPoint,
  _activeId?: string,
  _threshold = 16
) => {
  const sorted = [...list]
    .filter((item) => item.id !== INSERTED_ID)
    .sort((a, b) => b.level - a.level);
  const elemMap = mapFromArrayOfObjectsWithId(sorted);
  const root = sorted[sorted.length - 1];
  if (distanceToRect(mousePos, root) === 0) {
    const host = sorted.find((elem) => distanceToRect(mousePos, elem) === 0);
    const parentElem = host && elemMap.get(host.id);
    if (parentElem) {
      const trimmedHostRect = host && trimRect(host);
      if (trimmedHostRect && !insideRect(mousePos, trimmedHostRect)) return host;
      const trimmedParentRect = trimRect(parentElem);
      if (!insideRect(mousePos, trimmedParentRect)) return parentElem;
    }

    // are we over the host's parent's edge?
    return host && closestChildrenTwo(host, mousePos, sorted);
  }
  // outside frame
  return closestChildren(root, mousePos, sorted, _threshold);
};

const closestChildrenTwo = (host: IElement, mousePos: IPoint, list: IElement[]) => {
  const childNodes = list.filter((item) => item.parentId === host.id);
  let shortest = Number.MAX_SAFE_INTEGER;
  let activeElement = host;
  for (let i = 0; i < childNodes.length; i++) {
    const elem = childNodes[i];
    const dist = distanceToRect(mousePos, elem);
    if (dist < shortest) {
      shortest = dist;
      activeElement = elem;
    }
  }
  if (!activeElement) return host;
  return activeElement;
};

const closestChildren = (
  host: IElement,
  mousePos: IPoint,
  list: IElement[],
  _threshold: number
) => {
  const childNodes = list.filter((item) => item.parentId === host.id);
  let shortest = Number.MAX_SAFE_INTEGER;
  let activeElement = distanceToRect(mousePos, host) < _threshold ? host : undefined;
  for (let i = 0; i < childNodes.length; i++) {
    const elem = childNodes[i];
    const dist = distanceToRect(mousePos, elem);
    if (dist > _threshold) continue;
    if (dist < shortest) {
      shortest = dist;
      activeElement = elem;
    }
  }
  return activeElement;
};

export enum DropLocation {
  None,
  Before,
  Prepend,
  After,
  Append,
}

const sign = (p1: IPoint, p2: IPoint, p3: IPoint) => {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

export const getDropLocation = (element: IElement | undefined, mPos: IPoint): DropLocation => {
  if (!element) return DropLocation.None;
  const { x, y, width, height } = element;
  const topRight: IPoint = { x: x + width, y };
  const bottomLeft: IPoint = { y: y + height, x };
  const d = sign(mPos, topRight, bottomLeft);
  // const center: IPoint = { x: x + width * 0.5, y: y + height * 0.5 };
  const beforeAngule = d > 0;

  // Inside
  if (element.allowChildren && distanceToRect(mPos, element) === 0) {
    // Once inside we check against proximity to the edge
    const innerRect = trimRect(element);

    if (insideRect(mPos, innerRect)) {
      const divide = sign(
        mPos,
        { x: innerRect.x + innerRect.width, y: innerRect.y },
        { y: innerRect.y + innerRect.height, x: innerRect.x }
      );
      const ang = divide > 0;

      return ang ? DropLocation.Prepend : DropLocation.Append;

      // // const beforeVertical = mPos.y < center.y;
      // // const beforeHorizontal = mPos.x < center.x;
      // const wide = width > height;
      // // const test = wide ? beforeVertical : beforeHorizontal;
      // // const beforeWeight = +beforeAngule - +test;
      // const before = beforeAngule && wide ? mPos.x < center.x : mPos.y < center.y;

      // return before ? DropLocation.Prepend : DropLocation.Append;
    }
  }
  return beforeAngule ? DropLocation.Before : DropLocation.After;
};

export const dropLocationLabel = ['', 'Before', 'Prepend', 'After', 'Append'];

export const drawTop = (ctx: CanvasRenderingContext2D, activeElem: IElement) => {
  ctx.moveTo(activeElem.x, activeElem.y);
  ctx.lineTo(activeElem.x + activeElem.width, activeElem.y);
};

export const drawRight = (ctx: CanvasRenderingContext2D, activeElem: IElement) => {
  const rightX = activeElem.x + activeElem.width;
  ctx.moveTo(rightX, activeElem.y);
  ctx.lineTo(rightX, activeElem.y + activeElem.height);
};

export const drawLeft = (ctx: CanvasRenderingContext2D, activeElem: IElement) => {
  ctx.moveTo(activeElem.x, activeElem.y);
  ctx.lineTo(activeElem.x, activeElem.y + activeElem.height);
};

export const drawBottom = (ctx: CanvasRenderingContext2D, activeElem: IElement) => {
  const bottomY = activeElem.y + activeElem.height;
  ctx.moveTo(activeElem.x, bottomY);
  ctx.lineTo(activeElem.x + activeElem.width, bottomY);
};
