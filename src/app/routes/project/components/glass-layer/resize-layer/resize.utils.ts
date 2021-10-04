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

import { assignGlobalCursor, CursorState, CursorStateType, svgTranslate } from 'cd-utils/css';
import { IAnchorPoint, ILineAttr } from './resize.interfaces';
import { generateFrame } from 'cd-common/utils';
import { negate, half } from 'cd-utils/numeric';
import { UnitTypes } from 'cd-metadata/units';
import { EDGE } from 'cd-utils/geometry';
import * as cd from 'cd-interfaces';

const SNAP_THRESHOLD = 8;

export const createIPoint = (x: number, y: number, edge: EDGE): IAnchorPoint => {
  return { x, y, edge };
};

export const createLineAttr = (
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  edge: EDGE
): ILineAttr => {
  return { x1, x2, y1, y2, edge };
};

const cursorForEdge = (edge: EDGE, invert: boolean = false): CursorStateType => {
  if ([EDGE.Left, EDGE.Right].includes(edge)) return CursorState.EWResize;
  if ([EDGE.Top, EDGE.Bottom].includes(edge)) return CursorState.NSResize;

  if ([EDGE.TopLeft, EDGE.BottomRight].includes(edge))
    return invert ? CursorState.NESWResize : CursorState.NWSEResize;

  if ([EDGE.TopRight, EDGE.BottomLeft].includes(edge))
    return invert ? CursorState.NWSEResize : CursorState.NESWResize;

  return CursorState.Default;
};

export const getFullWidth = (_width: cd.IValue) => {
  return { width: createPercentIValue() };
};

export const getFullHeight = (_height: cd.IValue) => {
  return { height: createPercentIValue() };
};

export const getFullDimensions = (width?: cd.IValue, height?: cd.IValue) => {
  return (
    width?.units === UnitTypes.Pixels &&
    height?.units === UnitTypes.Pixels && {
      width: createPercentIValue(),
      height: createPercentIValue(),
    }
  );
};

export default class ResizeRect {
  private _width = 0;
  private _height = 0;
  public x = 0;
  public y = 0;
  public z = 0;
  /** Initial x position when moving */
  public ix = 0;
  public ox = 0;
  public iw = 0;
  /** Initial y position when moving */
  public iy = 0;
  public oy = 0;
  public ih = 0;
  public invertX = false;
  public invertY = false;

  private _cursor: CursorStateType = CursorState.Default;

  constructor(frame: cd.ILockingRect, zoom: number, public edge: EDGE, public lockedRatio = false) {
    this._width = frame.width;
    this._height = frame.height;
    this.x = frame.x;
    this.y = frame.y;
    this.z = zoom;
  }

  set width(v: number) {
    this._width = Math.round(v);
  }

  get width(): number {
    return this._width;
  }

  set height(v: number) {
    this._height = Math.round(v);
  }

  get height(): number {
    return this._height;
  }

  /** Set the initial position before moving */
  public orient(xp: number, yp: number) {
    const { x, y, z, width, height } = this;
    const zx = xp / z;
    const zy = yp / z;
    this.ix = zx - x;
    this.iy = zy - y;
    this.iw = width;
    this.ih = height;
    this.ox = x;
    this.oy = y;
    this.resize(xp, yp);
  }

  get isLeft(): boolean {
    return [EDGE.Left, EDGE.TopLeft, EDGE.BottomLeft].includes(this.edge);
  }

  get isRight(): boolean {
    return [EDGE.Right, EDGE.TopRight, EDGE.BottomRight].includes(this.edge);
  }

  get isTop(): boolean {
    return [EDGE.Top, EDGE.TopRight, EDGE.TopLeft].includes(this.edge);
  }

  get isBottom(): boolean {
    return [EDGE.Bottom, EDGE.BottomRight, EDGE.BottomLeft].includes(this.edge);
  }

  set cursor(cursor: CursorStateType) {
    if (cursor !== this._cursor) {
      assignGlobalCursor(cursor);
      this._cursor = cursor;
    }
  }

  resetCursor() {
    assignGlobalCursor(CursorState.Default);
  }

  resizeLockAspectRatio(xp: number, yp: number) {
    const { ix, iy, iw, ih, ox, oy, z } = this;
    const { isLeft, isRight, isTop } = this;

    const width = negate(iw, isLeft);
    const height = negate(ih, isTop);
    const verticalRule = ix - width;
    const horizontalRule = iy - height;
    const posX = xp / z - ox;
    const posY = yp / z - oy;
    const crossedHorzRule = posY > horizontalRule;
    const crossedVertRule = posX > verticalRule;
    const isHorizontal = isLeft || isRight;
    const aspectRatio = isHorizontal ? iw / ih : ih / iw;

    if (isHorizontal) {
      const deltaX = posX - ix + width;
      const offsetLeft = isLeft ? iw : 0;
      const x = ox + offsetLeft + (crossedVertRule ? 0 : deltaX);
      this.x = Math.round(x);
      this.width = negate(deltaX, crossedVertRule === false);
      this.height = this.width / aspectRatio;
    } else {
      const deltaY = posY - iy + height;
      const offsetTop = isTop ? ih : 0;
      const y = oy + offsetTop + (crossedHorzRule ? 0 : deltaY);
      this.y = Math.round(y);
      this.height = negate(deltaY, crossedHorzRule === false);
      this.width = this.height / (ih / iw);
    }

    this.updateCursor(crossedHorzRule, crossedVertRule);
  }

  // When resizing the outletFrame into negative teritory we need t oflip the curors
  updateCursor(crossedHorzRule: boolean, crossedVertRule: boolean) {
    const { isBottom, isRight, isLeft, isTop, edge } = this;
    const inverted = ((crossedHorzRule !== crossedVertRule) !== isRight) !== isBottom;
    this.invertX = crossedVertRule === isLeft;
    this.invertY = crossedHorzRule === isTop;
    this.cursor = cursorForEdge(edge, inverted);
  }

  resize(xp: number, yp: number, _shiftKey?: boolean, _altKey?: boolean) {
    if (_shiftKey || this.lockedRatio) return this.resizeLockAspectRatio(xp, yp);
    const { ix, iy, iw, ih, ox, oy, z } = this;
    const { isLeft, isRight, isBottom, isTop } = this;

    const width = negate(iw, isLeft);
    const height = negate(ih, isTop);
    const verticalRule = ix - width;
    const horizontalRule = iy - height;
    const posX = xp / z - ox;
    const posY = yp / z - oy;
    const crossedHorzRule = posY > horizontalRule;
    const crossedVertRule = posX > verticalRule;

    if (isTop !== isBottom) {
      const deltaY = posY - iy + height;
      const offsetTop = isTop ? ih : 0;
      const y = oy + offsetTop + (crossedHorzRule ? 0 : deltaY);
      this.y = Math.round(y);
      this.height = negate(deltaY, crossedHorzRule === false);
    }

    if (isLeft !== isRight) {
      const deltaX = posX - ix + width;
      const offsetLeft = isLeft ? iw : 0;
      const x = ox + offsetLeft + (crossedVertRule ? 0 : deltaX);
      this.x = Math.round(x);
      this.width = negate(deltaX, crossedVertRule === false);
    }

    this.updateCursor(crossedHorzRule, crossedVertRule);
  }

  get frame(): cd.IRect {
    const { x, y, width, height } = this;
    return { x, y, width, height };
  }

  get size() {
    const { width, height } = this;
    return { width, height };
  }
}

export const contentPositionForEdge = (
  resizeRect: ResizeRect,
  frame: cd.IRect,
  zoom: number,
  contentWidth: number,
  contentHeight: number,
  padding = 10
) => {
  const { edge, invertX, invertY } = resizeRect;
  const { width, height } = frame;
  const padd = padding / zoom;
  const cw = contentWidth / zoom;
  const ch = contentHeight / zoom;

  let x = 0;
  let y = 0;

  const isLeft = [EDGE.TopLeft, EDGE.Left, EDGE.BottomLeft].includes(edge);
  const isRight = [EDGE.TopRight, EDGE.Right, EDGE.BottomRight].includes(edge);
  const isTop = [EDGE.Top, EDGE.TopLeft, EDGE.TopRight].includes(edge);
  const isBottom = [EDGE.Bottom, EDGE.BottomLeft, EDGE.BottomRight].includes(edge);

  const left = invertX ? isRight : isLeft;
  const right = invertX ? isLeft : isRight;
  const top = invertY ? isBottom : isTop;
  const bottom = invertY ? isTop : isBottom;

  if (left) {
    x = -cw - padd;
  } else if (right) {
    x = width + padd;
  } else {
    x = half(-cw) + half(width);
  }

  if (top) {
    y = -ch - padd;
  } else if (bottom) {
    y = height + padd;
  } else {
    y = half(-ch) + half(height);
  }

  const xp = frame.x + x;
  const yp = frame.y + y;

  return svgTranslate(xp, yp);
};

const snap = (value: number, size: number, max: number, threshold = SNAP_THRESHOLD): number => {
  const pos = value + size;
  if (Math.abs(pos - max) < threshold) return max - value;
  // Snap half size
  // const halfMax = half(max);
  // if (Math.abs(pos - halfMax) < threshold) return halfMax - value;
  return size;
};

export const createPercentIValue = (value = 100): cd.IValue => {
  return { value, units: UnitTypes.Percent };
};

const snapToPercentage = (
  value: number,
  size: number,
  max: number,
  threshold = SNAP_THRESHOLD
): boolean => {
  const pos = value + size;
  return value === 0 && Math.abs(pos - max) < threshold;
};
export interface IResizePayload {
  width?: cd.IValue;
  height?: cd.IValue;
}
export class ResizeTracker {
  private _x: number;
  private _y: number;
  private _iWidth: number;
  private _iHeight: number;
  private _widthUnits: cd.Units;
  private _heightUnits: cd.Units;
  private _width: number;
  private _height: number;
  private _iFrameWidth: number;
  private _iFrameHeight: number;
  private _parentFrame: cd.IRect;

  constructor(width: cd.IValue, height: cd.IValue, frame: cd.IRect, parentFrame?: cd.IRect) {
    this._parentFrame = parentFrame || generateFrame();
    this._iWidth = this._width = Number(width && width.value) || frame.width;
    this._iFrameWidth = frame.width;
    this._widthUnits = (width && width.units) || UnitTypes.Pixels;
    this._iHeight = this._height = Number(height && height.value) || frame.height;
    this._heightUnits = (height && height.units) || UnitTypes.Pixels;
    this._iFrameHeight = frame.height;
    this._x = frame.x;
    this._y = frame.y;
  }

  update(
    { x, y, width, height }: cd.IRect,
    lockedAspectRatio: boolean
  ): IResizePayload | undefined {
    const { width: pw, height: ph } = this._parentFrame;
    this._width = lockedAspectRatio ? width : snap(x, width, pw);
    this._height = lockedAspectRatio ? height : snap(y, height, ph);
    this._x = x;
    this._y = y;
    return this.value;
  }

  generateIValue(
    value: number,
    initalValue: number,
    iFrameValue: number,
    units: cd.Units
  ): cd.IValue | undefined {
    if (units === UnitTypes.Percent) {
      value = Math.round((value / iFrameValue) * initalValue);
    }
    return { value, units };
  }

  get value(): IResizePayload | undefined {
    const { _width, _widthUnits, _iWidth, _iFrameWidth } = this;
    const { _heightUnits, _height, _iFrameHeight, _iHeight } = this;
    const wChange = _iWidth !== _width;
    const hChange = _iHeight !== _height;
    const width = wChange && this.generateIValue(_width, _iWidth, _iFrameWidth, _widthUnits);
    const height = hChange && this.generateIValue(_height, _iHeight, _iFrameHeight, _heightUnits);
    const obj = {};
    if (width) Object.assign(obj, { width });
    if (height) Object.assign(obj, { height });
    return obj;
  }

  finalValue(locked = false): IResizePayload | undefined {
    const { value, _parentFrame, _x, _width, _y, _height } = this;
    const { width, height } = _parentFrame;
    if (!value) return;
    const final = { ...value };
    if (locked) return final;

    if (final.width && final.width.units === UnitTypes.Pixels) {
      if (snapToPercentage(_x, _width, width)) {
        final.width = createPercentIValue();
      }
    }
    if (final.height && final.height.units === UnitTypes.Pixels) {
      if (snapToPercentage(_y, _height, height)) {
        final.height = createPercentIValue();
      }
    }
    return final;
  }
}

export const textValueFromIValue = (size?: cd.IValue): string | undefined => {
  if (!size || size.units !== UnitTypes.Percent) return;
  return size.value + size.units;
};

export const edgeFromTarget = (target: SVGElement): EDGE | undefined => {
  const edge = target.dataset.edge;
  return edge ? Number(target.dataset.edge) : undefined;
};
