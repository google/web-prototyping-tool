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
import { isWithinRange } from 'cd-utils/numeric';
import { generateFrame } from 'cd-common/utils';
import * as canvasUtils from '../../utils/canvas.utils';
import { deepCopy } from 'cd-utils/object';

// Determines sticky-ness of the snap, i.e. how far away the mouse must be before it unsnaps
export const SNAP_THRESHOLD = 6;

export type SnapPoint = [number | undefined, number | undefined];
export type ClientPositionAndDelta = [
  position: [x: number | undefined, y: number | undefined],
  delta: [x: number, y: number]
];

export class SnapPosition {
  public x: number | undefined;
  public y: number | undefined;

  update(x: number | undefined, y: number | undefined) {
    this.x = x;
    this.y = y;
  }

  reset() {
    this.x = undefined;
    this.y = undefined;
  }
}

/**
 * Compares two x/y positions to see if they are close enough to snap
 * @param edge1
 * @param edge2
 * @param threshold - Optional
 */
export const shouldSnap = (edge1: number, edge2: number, threshold = SNAP_THRESHOLD) => {
  return isWithinRange(edge1, edge2, threshold);
};

const getNewClientValue = (
  value: number | undefined,
  startingClientValue: number | undefined,
  client: number,
  threshold: number
): number | undefined => {
  if (value === undefined) return startingClientValue;
  if (isWithinRange(client, value, threshold)) return value;
  return undefined;
};

/**
 * Compares current clientX/Y values to saved values from first snapping
 * @param value The saved clientX/Y value
 * @param snapValue The current snapX/Y point
 * @param clientValue The current clientX/Y value
 * @param zoom The current zoom coefficient of the design surface
 * @param delta The deltaX/Y for the current move
 */
export const checkClientPosition = (
  value: number | undefined,
  snapValue: number | undefined,
  clientValue: number,
  zoom: number,
  delta: number
): [number | undefined, number] => {
  const clientZoomed = clientValue / zoom;
  const thresholdZoomed = SNAP_THRESHOLD / zoom;
  const initClientVal = snapValue !== undefined ? clientZoomed : undefined;
  const newClientValue = getNewClientValue(value, initClientVal, clientZoomed, thresholdZoomed);
  const newDelta = value && !newClientValue ? Math.sign(delta) * SNAP_THRESHOLD : delta;
  return [newClientValue, newDelta];
};

/**
 * Returns all unselected boards
 * @param outletRects
 * @param selectedOutletFrames
 */
export const getUnselectedBoards = (
  outletRects: Map<string, cd.IRenderResult>,
  selectedOutletFrames: ReadonlyArray<cd.IRenderResult>
): cd.IRenderResult[] => {
  const selectedIds = selectedOutletFrames.map((item) => item.id);
  return [...outletRects.values()].filter((board) => !selectedIds.includes(board.id));
};

const createLine = (x1: number, y1: number, x2: number, y2: number): cd.ILine => {
  return { x1, y1, x2, y2 };
};

/**
 * Returns snapping points given the selected bounds rectangle and a list of snapping lines
 * @param selectedRect
 * @param lines
 */
export const generateSnapPoints = (selectedRect: cd.IRect, lines: cd.ILine[]): SnapPoint => {
  const { x: sX, y: sY, width: sW, height: sH } = selectedRect;
  return lines.reduce<SnapPoint>(
    (acc, line) => {
      const { x1, y1, x2 } = line;
      const isVertical = x1 === x2;
      if (isVertical) {
        if (shouldSnap(x1, sX)) acc[0] = x1;
        if (shouldSnap(x1, sX + sW)) acc[0] = x1 - sW;
      } else {
        if (shouldSnap(y1, sY)) acc[1] = y1;
        if (shouldSnap(y1, sY + sH)) acc[1] = y1 - sH;
      }
      return acc;
    },
    [undefined, undefined]
  );
};

// Used when calculating the snap lines ONLY
const CALC_THRESHOLD = 2;

/**
 * Returns a list of snapping lines based on the currently
 * selected bounds and the other unselected boards
 * @param unselectedBoards
 * @param selectedRect
 */
export const calcSnapLines = (
  unselectedBoards: cd.IRenderResult[],
  selectedRect: cd.IRect
): cd.ILine[] => {
  const { x: sX, y: sY, width: sW, height: sH } = selectedRect;
  const sXP = sX + sW;
  const sYP = sY + sH;
  return unselectedBoards.reduce<cd.ILine[]>((acc, { frame: neighborFrame }) => {
    const { x: nX, y: nY, width: nW, height: nH } = neighborFrame;
    const nXP = nX + nW;
    const nYP = nY + nH;
    const neighborBelow = nY > sY;
    const neighborAfter = nX > sX;
    // S-Left to N-Left || S-Right to N-Left
    if (shouldSnap(nX, sX, CALC_THRESHOLD) || shouldSnap(nX, sXP, CALC_THRESHOLD)) {
      acc.push(neighborBelow ? createLine(nX, sY, nX, nYP) : createLine(nX, nY, nX, sYP));
    }

    // S-Left to N-Right || S-Right to N-Right
    if (shouldSnap(nXP, sX, CALC_THRESHOLD) || shouldSnap(nXP, sXP, CALC_THRESHOLD)) {
      acc.push(neighborBelow ? createLine(nXP, sY, nXP, nYP) : createLine(nXP, nY, nXP, sYP));
    }

    // S-Top to N-Top || S-Bottom to N-Top
    if (shouldSnap(nY, sY, CALC_THRESHOLD) || shouldSnap(nY, sYP, CALC_THRESHOLD)) {
      acc.push(neighborAfter ? createLine(sX, nY, nXP, nY) : createLine(nX, nY, sXP, nY));
    }

    // S-Top to N-Bottom || S-Bottom to N-Bottom
    if (shouldSnap(nYP, sY, CALC_THRESHOLD) || shouldSnap(nYP, sYP, CALC_THRESHOLD)) {
      acc.push(neighborAfter ? createLine(sX, nYP, nXP, nYP) : createLine(nX, nYP, sXP, nYP));
    }

    return acc;
  }, []);
};

export const rectWithDelta = (rect: cd.IRect, deltaX: number, deltaY: number): cd.IRect => {
  const { width, height, x: oldX, y: oldY } = rect;
  const x = oldX + deltaX;
  const y = oldY + deltaY;
  return generateFrame(x, y, width, height);
};

export const snapFrameToRect = (
  item: cd.IRenderResult,
  selectedRect: cd.IRect,
  deltaX: number,
  deltaY: number,
  [snapX, snapY]: SnapPoint,
  newSnapX: number | undefined,
  newSnapY: number | undefined
): cd.IRenderResult => {
  const { frame } = item;
  const { x, y } = frame;
  const selectedDX = x - selectedRect.x;
  const selectedDY = y - selectedRect.y;
  const newX = snapX !== undefined && newSnapX !== undefined ? snapX + selectedDX : x + deltaX;
  const newY = snapY !== undefined && newSnapY !== undefined ? snapY + selectedDY : y + deltaY;
  item.frame = { ...item.frame, x: newX, y: newY };
  return item;
};

export const rectFromSelectedOutlets = (selectedOutletFrames: ReadonlyArray<cd.IRenderResult>) => {
  const frames = selectedOutletFrames.map((frame) => frame.frame);
  const selectedBounds = canvasUtils.generateBounds(frames);
  return canvasUtils.boundsToIRect(selectedBounds);
};

export const generateSnapLines = (
  selectedOutletFrames: ReadonlyArray<cd.IRenderResult>,
  outletFrameRects: cd.RenderRectMap,
  selectedRect: cd.IRect
) => {
  const unselectedBoards = getUnselectedBoards(outletFrameRects, selectedOutletFrames);
  return calcSnapLines(unselectedBoards, selectedRect);
};

export const generateSnapPointFromDelta = (
  selectedRect: cd.IRect,
  deltaX: number,
  deltaY: number,
  lines: cd.ILine[]
) => {
  const newSelectedRect = rectWithDelta(selectedRect, deltaX, deltaY);
  return generateSnapPoints(newSelectedRect, lines);
};

export const generateClientPosAndDelta = (
  oldSnapPoint: SnapPosition,
  snapPoint: SnapPoint,
  clientX: number,
  clientY: number,
  deltaX: number,
  deltaY: number,
  zoom: number
): ClientPositionAndDelta => {
  const [snapX, snapY] = snapPoint;
  const { x: oldSnapX, y: oldSnapY } = oldSnapPoint;
  const [nx, dx] = checkClientPosition(oldSnapX, snapX, clientX, zoom, deltaX);
  const [ny, dy] = checkClientPosition(oldSnapY, snapY, clientY, zoom, deltaY);
  return [
    [nx, ny],
    [dx, dy],
  ];
};

export const snapSelectedOutlets = (
  selectedOutletFrames: ReadonlyArray<cd.IRenderResult>,
  outletFrameRects: cd.RenderRectMap,
  selectedRect: cd.IRect,
  snapPoint: SnapPoint,
  clientPositionAndDelta: ClientPositionAndDelta
): cd.RenderRectMap => {
  const [clientPosition, delta] = clientPositionAndDelta;
  const [x, y] = clientPosition;
  const [dx, dy] = delta;
  const newMap = deepCopy(outletFrameRects);
  for (const outlet of selectedOutletFrames) {
    const value = snapFrameToRect(outlet, selectedRect, dx, dy, snapPoint, x, y);
    newMap.set(outlet.rootId, value);
  }
  return newMap;
};
