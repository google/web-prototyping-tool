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

import { IContextAction, OVERLAY_OFFSET, ComponentAction } from './context-menu-bar.interface';
import { clamp, half } from 'cd-utils/numeric';
import { getComponent, isRoot, isSymbolInstance, isImage, isGeneric } from 'cd-common/models';
import { generateBounds } from '../../../utils/canvas.utils';
import * as cd from 'cd-interfaces';
import * as config from './context-menu-bar.config';

const MENU_BOUNDS_OFFSET = 12;

export const getSelectedIds = (map: cd.RenderElementMap): string[] => {
  if (map.size !== 1) return [];
  const [selectedBoardId] = [...map.keys()];
  const selectedElementsList = map.get(selectedBoardId);
  if (!selectedElementsList || selectedElementsList.length > 1) return [];
  return selectedElementsList;
};

const renderResultFromOutletOrRenderRects = (
  elementId: string,
  renderRects: cd.RenderRectMap,
  outletFrames: ReadonlyArray<cd.IRenderResult>
): cd.IRenderResult | undefined => {
  const outletFrame = outletFrames.find((item) => item.id === elementId);
  if (outletFrame) return outletFrame;
  return renderRects.get(elementId);
};

export const rectsForSelectedIds = (
  selectedIds: string[],
  renderRects: cd.RenderRectMap,
  outletFrames: ReadonlyArray<cd.IRenderResult>
) => {
  return selectedIds.reduce<cd.IRenderResult[]>((acc, elementId) => {
    const result = renderResultFromOutletOrRenderRects(elementId, renderRects, outletFrames);
    if (result) acc.push(result);
    return acc;
  }, []);
};

export const calculateSelectionBounds = (
  selectedIds: string[],
  renderRects: cd.RenderRectMap,
  outletFrames: ReadonlyArray<cd.IRenderResult>
): cd.Rect | undefined => {
  const selectedElementRects = rectsForSelectedIds(selectedIds, renderRects, outletFrames);
  if (selectedElementRects.length === 0) return;
  const [firstSelectedElementRect] = selectedElementRects;
  const rootFrame = outletFrames.find((root) => root.id === firstSelectedElementRect.rootId)?.frame;
  if (!rootFrame) return;
  const { x: outletX, y: outletY, width: outletWidth } = rootFrame;
  const rects: cd.IRect[] = selectedElementRects.map((elementRect) => {
    const { id, rootId, frame } = elementRect;
    const { x, y, width } = frame;
    const isElementRoot = id === rootId;
    const canvasXOffset = isElementRoot ? outletX + outletWidth : x + outletX + width;
    const canvasYOffset = isElementRoot ? outletY : y + outletY;
    const newFrame = { ...frame, x: canvasXOffset, y: canvasYOffset };
    return newFrame;
  });

  return generateBounds(rects);
};

/** minX, maxX, minY, maxY */
type MinMaxRect = [minX: number, maxX: number, minY: number, maxY: number];
export interface IAdjustedOverlay {
  overlayX: number;
  overlayY: number;
  adjustedViewport: MinMaxRect;
  zoomedCanvasX: number;
  zoomedCanvasY: number;
}

export const adjustedCanvasForOverlay = (
  canvas: cd.ICanvas,
  barHeight: number,
  barWidth: number,
  selectionBounds: cd.Rect
): IAdjustedOverlay => {
  const [selectionOffsetX, selectionOffsetY] = selectionBounds;
  const { position, offset, viewPortHeight, viewPortWidth } = canvas;
  const { x, y, z } = position;
  const zoomedCanvasX = x / z;
  const zoomedCanvasY = y / z;
  const zoomedOverlayOffset = OVERLAY_OFFSET / z;
  const overlayX = zoomedCanvasX + selectionOffsetX + zoomedOverlayOffset;
  const overlayY = zoomedCanvasY + selectionOffsetY + half(zoomedOverlayOffset);
  const [viewportX, viewportY] = offset;
  const viewportMinX = (viewportX + MENU_BOUNDS_OFFSET) / z;
  const viewportMinY = (viewportY + MENU_BOUNDS_OFFSET) / z;
  const viewportMaxX = (viewportX + viewPortWidth - MENU_BOUNDS_OFFSET - barWidth) / z;
  const viewportMaxY = (viewportY + viewPortHeight - MENU_BOUNDS_OFFSET - barHeight) / z;
  const adjustedViewport: MinMaxRect = [viewportMinX, viewportMaxX, viewportMinY, viewportMaxY];
  return { overlayX, overlayY, adjustedViewport, zoomedCanvasX, zoomedCanvasY };
};

export const menuRectIsVisible = (
  adjustedOverlay: IAdjustedOverlay,
  selectionBounds: cd.Rect,
  barWidth: number,
  barHeight: number,
  z: number
): boolean => {
  const { overlayX, overlayY, adjustedViewport } = adjustedOverlay;
  const [viewportMinX, viewportMaxX, viewportMinY, viewportMaxY] = adjustedViewport;
  const [, , width, height] = selectionBounds;
  const offset = MENU_BOUNDS_OFFSET / z;
  const adjustedWidth = width + (barWidth + MENU_BOUNDS_OFFSET) / z + offset;
  const adjustedHeight = height + offset;
  const adjustedMaxHeight = barHeight / z + offset;
  return (
    overlayX > viewportMinX - offset &&
    overlayX < viewportMaxX + adjustedWidth &&
    overlayY > viewportMinY - adjustedHeight &&
    overlayY < viewportMaxY + adjustedMaxHeight
  );
};

export const getMenuPosition = (adjustedOverlay: IAdjustedOverlay): [number, number] => {
  const { overlayX, overlayY, adjustedViewport, zoomedCanvasX, zoomedCanvasY } = adjustedOverlay;
  const [viewportMinX, viewportMaxX, viewportMinY, viewportMaxY] = adjustedViewport;
  const clampedX = clamp(overlayX, viewportMinX, viewportMaxX);
  const clampedY = clamp(overlayY, viewportMinY, viewportMaxY);
  const adjustedX = clampedX - zoomedCanvasX;
  const adjustedY = clampedY - zoomedCanvasY;
  return [adjustedX, adjustedY];
};

export const getContextActionsForElement = (element: cd.PropertyModel): IContextAction[] => {
  return config.CONTEXT_ACTIONS.filter((action) => {
    const cmp = getComponent(element.elementType);
    const childrenAllowed = cmp && cmp.childrenAllowed;
    // prettier-ignore
    switch (action.id) {
      case ComponentAction.AddComponent: return childrenAllowed;
      case ComponentAction.LayoutPreset: return isGeneric(element) || isRoot(element);
      case ComponentAction.ReplaceComponent: return !isRoot(element);
      case ComponentAction.CreatePortalFromElements: return isGeneric(element);
      // Board Actions
      case ComponentAction.FitBoardToContent: return isRoot(element);
      // Symbol Actions
      case ComponentAction.EditSymbol:
      case ComponentAction.DetachSymbol: return isSymbolInstance(element);
      // Code component actions
      case ComponentAction.EditCodeComponent: return element.isCodeComponentInstance;
      // Image Actions
      case ComponentAction.FitAspectRatio:
      case ComponentAction.ResetImageSize: return isImage(element);
      // Interaction Actions
      case ComponentAction.AddInteraction: return true;
      default: return false;
    }
  });
};

export const getMultiSelectContextActions = (): config.ContextActions => {
  return config.MULTI_SELECT_CONTEXT_ACTIONS;
};
