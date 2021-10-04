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

import ResizeRect, * as utils from './resize.utils';
import { Subscription, fromEvent, merge } from 'rxjs';
import { RenderRectMap, IRect } from 'cd-interfaces';
import { InfoTextComponent } from '../info-text/info-text.component';
import { half } from 'cd-utils/numeric';
import { EDGE } from 'cd-utils/geometry';
import { zoomLevelPercent } from '../glass.utils';
import { ILineAttr, IAnchorPoint } from './resize.interfaces';

const EDGE_SIZE = 6;

export class AbstractResizeLayer {
  protected _zoom = 1;
  protected _resizeTracker?: utils.ResizeTracker;
  protected _subscription = Subscription.EMPTY;
  protected _renderRects: RenderRectMap = new Map();
  protected _dragPointerId?: number;
  protected _hasResized = false;

  public lines: ReadonlyArray<ILineAttr> = [];
  public anchors: ReadonlyArray<IAnchorPoint> = [];
  public resizeRect?: ResizeRect;
  public fontSize = '';
  public resizeText = '';
  public infoTextPosition = '';
  public edgeSize = EDGE_SIZE;

  updateSizesFromZoom(zoom: number) {
    const size = EDGE_SIZE / zoom;
    this.fontSize = this.getFontSize(zoom);
    this.edgeSize = size;
  }

  getFontSize(zoom: number) {
    return zoomLevelPercent(zoom);
  }

  getPointerCancel() {
    return merge(
      fromEvent<PointerEvent>(window, 'pointerup'),
      fromEvent<PointerEvent>(window, 'pointerleave')
    );
  }

  set dragPointerId(pointerId: number) {
    if (pointerId === this._dragPointerId) return;
    this._dragPointerId = pointerId;
    document.body.setPointerCapture(pointerId);
  }

  resetPointerCapture() {
    if (this._dragPointerId) {
      document.body.releasePointerCapture(this._dragPointerId);
      this._dragPointerId = 0;
    }
  }

  stopPropagation = (e: MouseEvent) => {
    e.stopPropagation();
  };

  updateTextAndReturnLength({ width, height }: IRect): number {
    const { FONT_SPACING, TEXT_OFFSET_X } = InfoTextComponent;
    const { _resizeTracker } = this;
    const size = _resizeTracker && _resizeTracker.value;
    const w = (size && utils.textValueFromIValue(size.width)) || width;
    const h = (size && utils.textValueFromIValue(size.height)) || height;
    const txt = `${w} x ${h}`;
    this.resizeText = txt;
    return this.resizeText.length * FONT_SPACING + TEXT_OFFSET_X * 2;
  }

  updateLines(rect: IRect) {
    const { x, y, width, height } = rect;
    const right = width + x;
    const bottom = height + y;
    this.lines = [
      utils.createLineAttr(x, right, y, y, EDGE.Top),
      utils.createLineAttr(x, x, y, bottom, EDGE.Left),
      utils.createLineAttr(x, right, bottom, bottom, EDGE.Bottom),
      utils.createLineAttr(right, right, y, bottom, EDGE.Right),
    ];
  }

  updateAnchors(rect: IRect) {
    const { edgeSize } = this;
    const halfSize = half(edgeSize);
    const { x, y, width, height } = rect;
    const bx = x - halfSize;
    const by = y - halfSize;
    const rx = width + bx;
    const ry = height + by;
    const midX = bx + half(width);
    const midY = by + half(height);
    this.anchors = [
      // Corners
      utils.createIPoint(bx, by, EDGE.TopLeft),
      utils.createIPoint(rx, by, EDGE.TopRight),
      utils.createIPoint(bx, ry, EDGE.BottomLeft),
      utils.createIPoint(rx, ry, EDGE.BottomRight),
      // Mid Points
      utils.createIPoint(midX, by, EDGE.Top),
      utils.createIPoint(midX, ry, EDGE.Bottom),
      utils.createIPoint(bx, midY, EDGE.Left),
      utils.createIPoint(rx, midY, EDGE.Right),
    ];
  }
}
