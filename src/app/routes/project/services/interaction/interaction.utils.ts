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

import { clamp } from 'cd-utils/numeric';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ISelectionState } from '../../store/reducers/selection.reducer';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import * as config from '../../configs/outlet-frame.config';
import * as cd from 'cd-interfaces';

export type RootFrame = Pick<cd.RootElement, 'id' | 'frame' | 'elementType'>;

const OUTLET_FRAME_GRID_SIZE = 2;

export const selectionRectFromCanvas = (rect: cd.IRect, pos: cd.ICanvasPosition): cd.IRect => {
  const { x: cx, y: cy, z } = pos;
  const x = (rect.x - cx) / z;
  const y = (rect.y - cy) / z;
  const width = rect.width / z;
  const height = rect.height / z;
  return { x, y, width, height };
};

const roundValueToGrid = (value: number): number => {
  return Math.round(value / OUTLET_FRAME_GRID_SIZE) * OUTLET_FRAME_GRID_SIZE;
};

export const roundOutletFrameToGrid = (frame: cd.IRect): cd.IRect => {
  const x = roundValueToGrid(frame.x);
  const y = roundValueToGrid(frame.y);
  return { ...frame, x, y };
};

const clampOutletValue = (value: number): number => {
  return clamp(value, config.OUTLET_FRAME_MIN_SIZE, config.OUTLET_FRAME_MAX_SIZE);
};

export const clampOutletFrameDimensions = (frame: cd.IRect): cd.IRect => {
  const width = clampOutletValue(frame.width);
  const height = clampOutletValue(frame.height);
  return { ...frame, width, height };
};

export const didOrderChange = (
  prev: ReadonlyArray<string>,
  next: ReadonlyArray<string>
): boolean => {
  if (prev.length !== next.length) return true;
  return !next.every((item, idx) => item === prev[idx]);
};

const validateOutletFrameResults = (
  outletFrameId: string,
  renderResults: cd.IStringMap<cd.IRenderResult>,
  elementProperties: cd.ElementPropertiesMap
): cd.IStringMap<cd.IRenderResult> => {
  return Object.values(renderResults).reduce<cd.IStringMap<cd.IRenderResult>>(
    (outletFrameResultMap, value) => {
      const { id } = value;
      outletFrameResultMap[id] = value;
      if (!(id in elementProperties) && !environment.e2e) {
        console.warn(
          `RenderResults OutletFrameId: ${outletFrameId} missing element properties for ${id}`
        );
      }
      return outletFrameResultMap;
    },
    {}
  );
};

type ValidatedRenderResults = [
  outletFrameId: string,
  renderResults: cd.IStringMap<cd.IRenderResult>
];

export const validateRenderResults = (
  results: cd.IStringMap<cd.RenderResults>,
  elementProperties: cd.ElementPropertiesMap
): ReadonlyArray<ValidatedRenderResults> => {
  return Object.entries(results).reduce<ValidatedRenderResults[]>((acc, item) => {
    const [outletFrameId, renderResults] = item;
    if (outletFrameId in elementProperties) {
      const outletFrameResults = validateOutletFrameResults(
        outletFrameId,
        renderResults,
        elementProperties
      );
      acc.push([outletFrameId, outletFrameResults]);
    } else {
      // THIS OKAY, AND IGNORED BUT USED FOR DEVELOPMENT TO IDENTIFY TIMING ISSUES BETWEEN THE RENDERER AND STORE
      console.warn(`RenderResults OutletFrameId: ${outletFrameId} missing in element properties`);
    }
    return acc;
  }, []);
};

export class InteractionQueue {
  private _timer = 0;
  public interacting$ = new BehaviorSubject(false);
  constructor(public timeout = 550) {}

  set interacting(value: boolean) {
    if (this.interacting$.value === value) return;
    this.interacting$.next(value);
  }

  didInteract() {
    window.clearTimeout(this._timer);
    this.interacting = true;
    this._timer = window.setTimeout(this.stopInteracting, this.timeout);
  }

  stopInteracting = () => {
    this.interacting = false;
  };
}

export const buildSelectionOutletMap = (
  outlets: Set<string>,
  selectionState: ISelectionState,
  elementProperties: cd.ElementPropertiesMap
): cd.RenderElementMap => {
  const { ids, outletFramesSelected } = selectionState;
  const elemIdList = Array.from(ids).filter((item) => outlets.has(item) === false);
  return [...outlets].reduce((selectionMap, outletFrameId) => {
    const values = elemIdList.reduce((refs: string[], elemId) => {
      const ref = elementProperties[elemId];
      if (ref && ref.rootId === outletFrameId) refs.push(elemId);
      return refs;
    }, []);

    if (outletFramesSelected) values.push(outletFrameId);
    selectionMap.set(outletFrameId, values);

    return selectionMap;
  }, new Map());
};

export const bringOutletToFront = (
  order: string[],
  outletIds: Set<string>
): ReadonlyArray<string> => {
  return [...outletIds].reduce<string[]>((acc, outletFrameId) => {
    const lastItem = acc[acc.length - 1];
    if (lastItem === outletFrameId) return acc;
    const idx = acc.indexOf(outletFrameId);
    const outletFrames = removeValueFromArrayAtIndex(idx, acc);
    return [...outletFrames, outletFrameId];
  }, order);
};

export const filterBoardsVisibleInViewport = (
  canvas: cd.ICanvas,
  boards: ReadonlyArray<RootFrame>
): ReadonlyArray<string> => {
  const { z, y: cy, x: cx } = canvas.position;
  const [viewportX, viewportY] = canvas.offset;
  const { viewPortWidth, viewPortHeight } = canvas;
  const viewportMinX = viewportX / z;
  const viewportMinY = viewportY / z;
  const viewportMaxX = (viewportX + viewPortWidth) / z;
  const viewportMaxY = (viewportY + viewPortHeight) / z;
  const zoomedCanvasX = cx / z;
  const zoomedCanvasY = cy / z;
  return boards
    .filter((board) => {
      const { width, height, x, y } = board.frame;
      const ox = x + zoomedCanvasX;
      const oy = y + zoomedCanvasY;
      return (
        ox + width > viewportMinX &&
        ox < viewportMaxX &&
        oy > viewportMinY - height &&
        oy < viewportMaxY
      );
    })
    .map((item) => item.id);
};
