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
import { generateFrame, removePtFromOutletFrame } from 'cd-common/utils';
import { UnitTypes } from 'cd-metadata/units';
import type { SimpleChanges } from '@angular/core';
import { areArraysEqual } from 'cd-utils/array';

const calculateScrollFrame = (prevFrame: cd.IRect, nextFrame: cd.IRect): cd.IRect => {
  const { x, y, width, height } = nextFrame;
  const w = x < prevFrame.x ? prevFrame.width + Math.abs(x) : Math.abs(prevFrame.x) + width + x;
  const h = y < prevFrame.y ? prevFrame.height + Math.abs(y) : Math.abs(prevFrame.y) + height + y;
  if (w > prevFrame.width) prevFrame.width = w;
  if (h > prevFrame.height) prevFrame.height = h;
  if (x < prevFrame.x) prevFrame.x = x;
  if (y < prevFrame.y) prevFrame.y = y;
  return prevFrame;
};

/** The scrollrect is an approximation of board size which includes offscreen (clipped) elements */
export const calculateScrollFrameFromOutletFrame = (
  outletFrame: cd.PropertyModel,
  renderRects: cd.IStringMap<cd.RenderResults> | undefined
) => {
  const outletFrameRect = sanitizeOutletFrame(outletFrame);
  const outletFrameElements = renderRects?.[outletFrame.id] || {};
  // Filter the current board rect
  const elements = Object.values(outletFrameElements).filter((item) => item.id !== outletFrame.id);
  const initalFrame = { ...outletFrameRect, width: 0, height: 0 };
  return elements.reduce((frame, elemRect) => {
    return calculateScrollFrame(frame, elemRect.frame);
  }, initalFrame);
};

/** Outlet frames have an x, y value but we need to remove those to normalize the rects inside a board */
const sanitizeOutletFrame = (outletFrame?: cd.IRenderResult | cd.PropertyModel): cd.IRect => {
  return outletFrame ? removePtFromOutletFrame(outletFrame.frame) : generateFrame();
};

export const scrollRectFromElementRects = (
  elements: cd.RenderElementMap,
  renderRects: cd.RenderRectMap
): ReadonlyMap<string, cd.IRect> => {
  return [...elements.entries()].reduce((acc, item) => {
    const [key, values] = item;
    const outletFrame = renderRects.get(key);
    const frameRect = sanitizeOutletFrame(outletFrame);
    const rect = values.reduce((frame, elemId) => {
      const elemRect = renderRects.get(elemId)?.frame;
      return elemRect ? calculateScrollFrame(frame, elemRect) : frame;
    }, frameRect);

    acc.set(key, rect);
    return acc;
  }, new Map());
};

export const areRectDimensionsEqual = (rectA: cd.IRect, rectB: cd.IRect): boolean => {
  return rectA.width === rectB.width && rectA.height === rectB.height;
};

export const areRectsWithinBounds = (
  bounds: cd.IRect,
  values: ReadonlyArray<string>,
  lookup: cd.RenderRectMap
): boolean => {
  return values.some((value) => {
    const item = lookup.get(value);
    if (item) {
      const { x, y, width, height } = item.frame;
      const diffx = x + width;
      const diffy = y + height;
      if (x < 0 || diffx > bounds.width) return true;
      if (y < 0 || diffy > bounds.height) return true;
    }
    return false;
  });
};

const USER_SETTINGS_KEYS: ReadonlyArray<keyof cd.IUserSettings> = [
  'breakGlass',
  'debugCanvas',
  'debugDragAndDrop',
  'debugGlass',
  'disableContextualOverlay',
];
/** This allows us to only call change detection of these settings change */
export const filterUserDebugSettings = (x: cd.IUserSettings, y: cd.IUserSettings) => {
  return USER_SETTINGS_KEYS.every((key) => x[key] === y[key]);
};

export const zoomLevelPercent = (zoom: number): string => {
  return Math.round(100 / zoom) + UnitTypes.Percent;
};

export const cloneOutletAndRemoveCoordinates = (outlet: cd.IRenderResult): cd.IRenderResult => {
  const { frame, ...args } = outlet;
  const outletFrame = removePtFromOutletFrame(outlet.frame);
  return { frame: outletFrame, ...args };
};

export const rectFromOutletOrRenderRects = (
  id: string,
  renderRects: cd.RenderRectMap,
  outlet?: cd.IRenderResult
) => {
  return outlet && id === outlet.id ? cloneOutletAndRemoveCoordinates(outlet) : renderRects.get(id);
};

export const sortOutletFrames = (
  frames: ReadonlyArray<cd.IRenderResult> = [],
  order: ReadonlyArray<string> = []
): cd.IRenderResult[] => {
  return [...frames].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
};

/** How many elements are selected, this is not straightforward because each board has their own selection state  */
export const sizeFromSelection = (selection: cd.RenderElementMap): number => {
  return [...selection.values()].reduce((acc, curr) => (acc += curr.length), 0);
};

export const didValueChangeForKey = <T>(key: keyof T, changes: SimpleChanges): boolean => {
  if (!(key in changes)) return false;
  const change = (changes as any)[key];
  return change.currentValue !== change.previousValue;
};

export const didArrayValueChangeForKey = <T>(key: keyof T, changes: SimpleChanges): boolean => {
  if (!(key in changes)) return false;
  const change = (changes as any)[key];
  return areArraysEqual(change.previousValue, change.currentValue) === false;
};

/** Convert array of all peer selections into arrays of rects per board */
export const buildPeerRects = (
  peerSelection: cd.IUserSelection[],
  renderRects: cd.RenderRectMap,
  outletFrameRects: cd.RenderRectMap
): Record<string, cd.IUserRect[]> => {
  const clones = new Map<string, cd.IRenderResult>();

  return peerSelection.reduce<Record<string, cd.IUserRect[]>>((acc, curr) => {
    const { sessionId, selectedIdsByOutlet } = curr;

    for (const entry of Object.entries(selectedIdsByOutlet)) {
      const [outletId, selectedIds] = entry;
      const outletFrame = outletFrameRects.get(outletId);
      if (!outletFrame) continue;

      const rects = selectedIds.reduce<cd.IUserRect[]>((rectAcc, id) => {
        const outletClone = clones.get(outletId) || cloneOutletAndRemoveCoordinates(outletFrame);
        clones.set(outletId, outletClone); // prevent cloning the same outlet more than once

        const isOutlet = id === outletId;
        const renderResult = isOutlet ? outletClone : renderRects.get(id);
        if (!renderResult) return rectAcc;
        rectAcc.push({ sessionId, renderResult });
        return rectAcc;
      }, []);
      const currentRects = acc[outletId] || [];
      acc[outletId] = [...currentRects, ...rects];
    }

    return acc;
  }, {});
};
