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
  IPanel,
  IRect,
  ICanvas,
  ICanvasDimensions,
  ICanvasPosition,
  IRectRange,
  IScrollbar,
  Rect,
} from 'cd-interfaces';
import { clamp, half, roundToDecimal } from 'cd-utils/numeric';
import { IPanelsState } from '../interfaces/panel.interface';
import * as config from '../configs/canvas.config';

const TOP_BAR_HEIGHT = 42;
const ACTIVITY_BAR_WIDTH = 48;

/**
 * Find the scroll boundary of a canvas
 * @param canvas ICanvas
 * @param zoom Zoom
 */
const calculateScrollBounds = (canvas: ICanvas, zoom: number): Rect => {
  const { viewPortWidth, viewPortHeight, bounds, offset } = canvas;
  const [offsetLeft, offsetTop] = offset;
  const [x, y, w, h] = bounds;
  const top = -(y + h) * zoom;
  const left = -(x + w) * zoom;
  const right = -x * zoom + viewPortWidth;
  const bottom = -y * zoom + viewPortHeight;
  const padding = config.BOUNDS_PADDING; // * zoom
  const minX = left + padding + offsetLeft;
  const minY = top + padding + offsetTop;
  const maxX = right - padding + offsetLeft;
  const maxY = bottom - padding + offsetTop;
  return [minX, minY, maxX, maxY];
};

const panelSize = (panel: IPanel): number => (panel.visible ? panel.size : 0);

/**
 * Calculates the viewport based on changes to panelState
 * @param panelState
 */
export const calculateViewport = (panelState: IPanelsState): ICanvasDimensions => {
  const { leftPanel, rightPanel, bottomPanel } = panelState;
  const { innerHeight, innerWidth } = window;
  const offsetTop = TOP_BAR_HEIGHT;
  const offsetBottom = panelSize(bottomPanel);
  const offsetRight = panelSize(rightPanel);
  const offsetLeft = panelSize(leftPanel) + ACTIVITY_BAR_WIDTH;
  const viewPortWidth = innerWidth - offsetLeft - offsetRight;
  const viewPortHeight = innerHeight - offsetBottom - offsetTop;
  const offset: Rect = [offsetLeft, offsetTop, offsetRight, offsetBottom];
  return { viewPortWidth, viewPortHeight, offset };
};

/**
 * Clamp the position to the canvas scroll bounds
 * @param x Canvas x position
 * @param y Canvas y postion
 * @param z Canvas z (scale)
 * @param canvas ICanvas
 */
export const clampToBounds = (
  xp: number,
  yp: number,
  zp: number,
  canvas: ICanvas
): ICanvasPosition => {
  const z = roundToDecimal(zp, 4);
  const [minX, minY, maxX, maxY] = calculateScrollBounds(canvas, z);
  const x = roundToDecimal(clamp(xp, minX, maxX), 3) || 0;
  const y = roundToDecimal(clamp(yp, minY, maxY), 3) || 0;
  return { x, y, z };
};

/**
 * Pan a canvas inside the scroll bounds
 * @param dx Mouse wheel deltaX
 * @param dy Mouse wheel deltaY
 * @param canvas ICanvas
 */
export const panPosition = (dx: number, dy: number, canvas: ICanvas): ICanvasPosition => {
  const { x, y, z } = canvas.position;
  const xp = x - dx * config.PAN_MULTIPLIER;
  const yp = y - dy * config.PAN_MULTIPLIER;
  return clampToBounds(xp, yp, z, canvas);
};

/**
 * Find the RectRange for a given IBoard
 */
const mapBounds = (frame: IRect): IRectRange => {
  const { x: xMin = 0, y: yMin = 0, width = 0, height = 0 } = frame;
  const xMax = xMin + width;
  const yMax = yMin + height;
  return { xMin, yMin, xMax, yMax };
};

/**
 * Find the bounds for an array of boards
 */
export const generateBounds = (frames: ReadonlyArray<IRect> = []): Rect => {
  if (frames.length === 0) return <Rect>Array(4).fill(0);
  const bounds = frames.map(mapBounds);
  const x = Math.min(...bounds.map((item) => item.xMin));
  const y = Math.min(...bounds.map((item) => item.yMin));
  const right = Math.max(...bounds.map((item) => item.xMax));
  const bottom = Math.max(...bounds.map((item) => item.yMax));
  const width = right - x;
  const height = bottom - y;
  return [x, y, width, height];
};

/**
 * Converts a bounds to an IRect
 */
export const boundsToIRect = ([x, y, width, height]: Rect): IRect => ({ x, y, width, height });

/**
 * The the position of the canvas so all boards are visible
 *  and center vertically and horizontally
 * @param canvas ICanvas
 */
export const calculateFitToBounds = (canvas: ICanvas): ICanvasPosition => {
  const { bounds, viewPortWidth, viewPortHeight, offset } = canvas;
  const [offsetLeft, offsetTop] = offset;
  const [x, y, canvasWidth, canvasHeight] = bounds;
  const { INNER_PADDING } = config;
  const wider = canvasWidth > viewPortWidth;
  const taller = canvasHeight > viewPortHeight;
  const wideZoom = (viewPortWidth - INNER_PADDING) / (canvasWidth + INNER_PADDING);
  const tallZoom = (viewPortHeight - INNER_PADDING) / (canvasHeight + INNER_PADDING);

  let z = 1;

  if (wider && taller) {
    z = wideZoom < tallZoom ? wideZoom : tallZoom;
  } else if (wider) {
    z = wideZoom;
  } else if (taller) {
    z = tallZoom;
  }
  const zp = clamp(z, 0, config.MAX_ZOOM);
  const xp = half(viewPortWidth) - half(canvasWidth) * zp - x * zp + offsetLeft;
  const yp = half(viewPortHeight) - half(canvasHeight) * zp - y * zp + offsetTop;
  return clampToBounds(xp, yp, zp, canvas);
};

/**
 * Zoom to a specific point in the canvas
 * @param px Position.x - canvas.offsetLeft
 * @param py Position.y - canvas.offsetTop
 * @param pz Position.z - deltaY
 * @param canvas ICanvas
 */
export const calculateZoomToPoint = (
  px: number,
  py: number,
  pz: number,
  canvas: ICanvas
): ICanvasPosition => {
  const { x, y, z } = canvas.position;
  const nz = clamp(pz, config.MIN_ZOOM, config.MAX_ZOOM);
  const xz = (px - x) / z;
  const yz = (py - y) / z;
  const ox = xz * nz;
  const oy = yz * nz;
  const xp = xz + (px - xz) - ox;
  const yp = yz + (py - yz) - oy;
  const zp = nz;

  return clampToBounds(xp, yp, zp, canvas);
};

/**
 * Zoom to the center of the canvas
 * @param zoomAmount
 * @param canvas ICanvas
 */
export const calculateZoomToCenter = (zoomAmount: number, canvas: ICanvas): ICanvasPosition => {
  const { viewPortWidth, viewPortHeight, offset } = canvas;
  const [offsetLeft, offsetTop] = offset;
  const x = half(viewPortWidth) + offsetLeft;
  const y = half(viewPortHeight) + offsetTop;
  return calculateZoomToPoint(x, y, zoomAmount, canvas);
};

/**
 * From some given IBoards, zoom to center them in the viewport
 * @param boards IBoard[]
 * @param canvas ICanvas
 */
export const calculateZoomToBoards = (
  boardFrames: IRect[],
  canvas: ICanvas,
  zoom?: number
): ICanvasPosition => {
  const { viewPortWidth, viewPortHeight, offset } = canvas;
  const [offsetLeft, offsetTop] = offset;
  const { MIN_ZOOM, BOARD_PADDING_MULTIPLIER } = config;
  const [bx, by, width, height] = generateBounds(boardFrames);
  const widthRatio = viewPortWidth / (width * BOARD_PADDING_MULTIPLIER);
  const heightRatio = viewPortHeight / (height * BOARD_PADDING_MULTIPLIER);
  const zu = Math.min(widthRatio, heightRatio);
  const newZoom = zoom && zoom < 1 ? zoom : zu;
  const z = clamp(newZoom, MIN_ZOOM, 1);
  const x = half(viewPortWidth) - bx * z - half(width) * z + offsetLeft;
  const y = half(viewPortHeight) - by * z - half(height) * z + offsetTop;
  return { x, y, z };
};

/**
 * Checks if the canvas bounds are 0 0 0 0
 * @param canvas ICanvas
 */
export const canvasHasBounds = (canvas: ICanvas): boolean =>
  !canvas.bounds.every((value) => value === 0);

const scrollbarSize = (maxSize: number, scale: number): number => {
  const size = maxSize * (1 - half(scale));
  return clamp(size, config.MIN_SCROLLBAR_SIZE, maxSize);
};

const scrollbarPos = (value: number, min: number, max: number): number => {
  return 1 - (value - min) / (max - min);
};

export const calculateScrollbars = (canvas: ICanvas): IScrollbar => {
  const { x, y, z } = canvas.position;
  const { viewPortWidth, viewPortHeight, offset } = canvas;
  const [offsetLeft, offsetTop, offsetRight, offsetBottom] = offset;
  const [minX, minY, maxX, maxY] = calculateScrollBounds(canvas, z);
  const vertX = -offsetRight;
  const vertY = -offsetBottom;
  const horzSize = scrollbarSize(viewPortWidth, z);
  const vertSize = scrollbarSize(viewPortHeight, z);
  const width = viewPortWidth - offsetLeft + offsetRight;
  const height = viewPortHeight - offsetTop + offsetBottom;
  const horzSizeDiff = half(width) - half(horzSize);
  const vertSizeDiff = half(height) - half(vertSize);
  const horzPos = scrollbarPos(x, minX, maxX) * (viewPortWidth - horzSize) - horzSizeDiff;
  const vertPos = scrollbarPos(y, minY, maxY) * (viewPortHeight - vertSize) - vertSizeDiff;
  return { vertSize, vertPos, horzSize, horzPos, vertX, vertY };
};
