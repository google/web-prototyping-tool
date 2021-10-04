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

import { createPoint, IPoint, distance } from 'cd-utils/geometry';
import { generateFrame } from 'cd-common/utils';
import { isSymbol } from 'cd-common/models';
import { half } from 'cd-utils/numeric';
import * as cd from 'cd-interfaces';

const LINE_EDGE_OFFSET = 20;

type CompassPoints = [IPoint, IPoint, IPoint, IPoint];

enum CardinalDirection {
  North = 0,
  South = 1,
  East = 2,
  West = 3,
}

export interface IPosition {
  point: IPoint;
  direction: CardinalDirection;
}

export interface IActionPath {
  id?: string;
  path?: string;
  from: string;
  to: string;
  fromRect?: cd.IRect;
}

export const getStartAndEndFrames = (rects: cd.RenderRectMap, action: IActionPath) => {
  const fromRect = rects.get(action.from);
  const toRect = rects.get(action.to);
  if (!toRect || !fromRect) return;

  const fromRoot = rects.get(fromRect.rootId);
  const toRoot = rects.get(toRect.rootId);
  if (!fromRoot || !toRoot) return;

  const fromRootIsFromRect = fromRoot.id === fromRect.id;
  const startX = fromRootIsFromRect ? fromRect.frame.x : fromRoot.frame.x + fromRect.frame.x;
  const startY = fromRootIsFromRect ? fromRect.frame.y : fromRoot.frame.y + fromRect.frame.y;

  const toRootIsToRect = toRoot.id === toRect.id;
  const endX = toRootIsToRect ? toRect.frame.x : toRoot.frame.x + toRect.frame.x;
  const endY = toRootIsToRect ? toRect.frame.y : toRoot.frame.y + toRect.frame.y;

  const startFrame = generateFrame(startX, startY, fromRect.frame.width, fromRect.frame.height);
  const endFrame = generateFrame(endX, endY, toRect.frame.width, toRect.frame.height);

  return { startFrame, endFrame };
};

export const generateCompassPoints = (rect: cd.IRect): CompassPoints => {
  const { x, y, width, height } = rect;
  const halfWidth = half(width);
  const halfHeight = half(height);
  const bottom = y + height;
  const right = width + x;
  const centerY = y + halfHeight;
  const centerX = x + halfWidth;
  const north = createPoint(centerX, y);
  const south = createPoint(centerX, bottom);
  const east = createPoint(right, centerY);
  const west = createPoint(x, centerY);
  return [north, south, east, west];
};

export const generateStartAndEndPoints = (
  startPoints: CompassPoints,
  endPoints: CompassPoints
): {
  start: IPosition;
  end: IPosition;
} => {
  let shortestDistance = Number.MAX_SAFE_INTEGER;
  let startPt = createPoint();
  let endPt = createPoint();
  let endDirection = CardinalDirection.North;
  let startDirection = CardinalDirection.North;

  for (let i = 0; i < startPoints.length; i++) {
    const startPoint = startPoints[i];
    for (let j = 0; j < endPoints.length; j++) {
      const endPoint = endPoints[j];
      const dist = distance(startPoint, endPoint);
      if (dist >= shortestDistance) continue;
      endDirection = j;
      startDirection = i;
      startPt = startPoint;
      endPt = endPoint;
      shortestDistance = dist;
    }
  }
  const start = { point: startPt, direction: startDirection };
  const end = { point: endPt, direction: endDirection };
  return { start, end };
};

export const buildPath = (start: IPosition, end: IPosition): string => {
  const nextStart = buildLine(start);
  const nextEnd = buildLine(end);
  const polyline = [start.point, nextStart, nextEnd, end.point].map((item) => [item.x, item.y]);
  return polyline.map((item) => item.toString()).join(' ');
};

export const buildLine = ({ point, direction }: IPosition, offset = LINE_EDGE_OFFSET): IPoint => {
  if (direction === CardinalDirection.North) return createPoint(point.x, point.y - offset);
  if (direction === CardinalDirection.South) return createPoint(point.x, point.y + offset);
  if (direction === CardinalDirection.East) return createPoint(point.x + offset, point.y);
  return createPoint(point.x - offset, point.y);
};

export const paddFrame = (frame: cd.IRect, padding: number) => {
  const halfPadding = half(padding);
  const x = frame.x - halfPadding;
  const y = frame.y - halfPadding;
  const width = frame.width + padding;
  const height = frame.height + padding;
  return generateFrame(x, y, width, height);
};

const buildActionPath = (id: string | undefined, to: string, from: string): IActionPath => {
  return { id, to, from };
};

export const buildActionsFromProps = (elements: cd.ElementPropertiesMap) => {
  // Filter elements without actions and elements who have actions inside a symbol
  const validActionsFromElements = Object.values(elements)
    .filter((item) => item?.actions?.length)
    .filter((item) => {
      const rootId = item?.rootId;
      if (!rootId) return false;
      const rootElement = elements[rootId];
      return rootElement && !isSymbol(rootElement);
    }) as cd.PropertyModel[];

  return validActionsFromElements.reduce<IActionPath[]>((acc, prop) => {
    const from = prop?.id;
    for (const action of prop.actions) {
      const target = action.target;
      if (!target || !elements[target]) continue;
      const actionPath = buildActionPath(action.id, target, from);
      acc.push(actionPath);
    }

    return acc;
  }, []);
};
