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

import { IOverlayConfig } from './overlay.service';
import { generateSVGPath } from 'cd-utils/svg';
import { clamp } from 'cd-utils/numeric';

export const pathFromParentRect = (config: IOverlayConfig | undefined): string => {
  const { innerHeight: h, innerWidth: w } = window;
  const outside = generateSVGPath([0, 0], [w, 0], [w, h], [0, h], [0, 0]);
  if (!config || !config.parentRect) return outside;
  const { top, left, width, height } = config.parentRect;

  const right = left + width;
  const bottom = top + height;
  const inside = config.clipParentRect
    ? generateSVGPath([left, top], [left, bottom], [right, bottom], [right, top], [left, top])
    : '';
  return outside + inside;
};

export const getChildBounds = (element: HTMLElement): DOMRect => {
  const bounds = element.getBoundingClientRect();
  if (bounds.width === 0 && bounds.height === 0) {
    const child = element?.children[0] as HTMLElement;
    if (child) return getChildBounds(child);
  }
  return bounds;
};

const OVERLAY_PADDING = 20;

export const calculateOverlayPosition = (
  width: number,
  height: number,
  x?: number,
  y?: number,
  alignRight = false
): [x: number, y: number] => {
  const { innerWidth, innerHeight, screen, outerHeight, screenY, screenX } = window;
  const { availLeft = 0, availTop = 0 } = <any>window.screen;
  const _x = x ?? OVERLAY_PADDING;
  const _y = y ?? OVERLAY_PADDING;

  // Checks to see if the overlay is cut off by the browser window position
  const h = screen.availHeight - screenY - outerHeight + availTop;
  const w = screen.availWidth - screenX - innerWidth + availLeft;
  const hy = h < 0 ? innerHeight + h : innerHeight;
  const hx = w < 0 ? innerWidth + w : innerWidth;

  const maxx = alignRight ? hx - OVERLAY_PADDING : hx - width - OVERLAY_PADDING;
  const xp = clamp(_x, OVERLAY_PADDING, maxx);
  const yp = clamp(_y, OVERLAY_PADDING, hy - height - OVERLAY_PADDING);
  return [xp, yp];
};
