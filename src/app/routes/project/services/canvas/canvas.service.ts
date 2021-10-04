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

import { IBoardProperties, ICanvas, ICanvasPosition, Rect } from 'cd-interfaces';
import { Injectable } from '@angular/core';
import { IPanelsState } from '../../interfaces/panel.interface';
import { movePoint } from '../../utils/store.utils';
import { clamp, isBetween, roundToDecimal } from 'cd-utils/numeric';
import * as config from '../../configs/canvas.config';
import * as utils from '../../utils/canvas.utils';
import { BehaviorSubject } from 'rxjs';
import { deepCopy } from 'cd-utils/object';
import { debounceTime } from 'rxjs/operators';

const MOVE_TIMEOUT = 100;
const EASE_DURATION = 242;

const ease = (n: number): number => 1 - (1 - n) ** 3;

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  private _savedState: ICanvas[] = [];
  private _animation = 1;
  public isMoving$ = new BehaviorSubject<boolean>(false);
  public canvas$ = new BehaviorSubject<ICanvas>({ ...config.initialCanvas.canvas });

  constructor() {
    this.canvas$.pipe(debounceTime(MOVE_TIMEOUT)).subscribe(this.onCanvasMoveComplete);
  }

  onCanvasMoveComplete = () => {
    this.isMoving = false;
  };

  get canvas() {
    return this.canvas$.getValue();
  }

  get isMoving() {
    return this.isMoving$.getValue();
  }

  set isMoving(value: boolean) {
    if (this.isMoving$.value === value) return;
    this.isMoving$.next(value);
  }

  set canvas(value: ICanvas) {
    this.canvas$.next(value);
    this.isMoving = true;
  }

  /**
   * Update canvas values and emit change
   * @param canvas
   */
  updateCanvas(canvas: Partial<ICanvas>, resetAnimation = true) {
    if (resetAnimation) this.resetAnimation();
    this.canvas = { ...this.canvas, ...canvas };
  }

  /**
   * When deleting all boards or resetting the canvas
   * @param bounds Bounds of all boards
   */
  reset(bounds: Rect = [0, 0, 0, 0]): ICanvas {
    const position = { ...config.initialCanvas.canvas.position };
    this.updateCanvas({ bounds, position });
    return this.canvas;
  }

  /**
   * Updates the bounding box of the canvas based on panel state
   * @param panelState
   */
  updateViewport(panelState: IPanelsState) {
    const updatedDimensions = utils.calculateViewport(panelState);
    this.updateCanvas(updatedDimensions);
  }

  /**
   * Pan using mouse wheel, called from canvas.component
   * @param deltaX
   * @param deltaY
   */
  pan(deltaX: number, deltaY: number) {
    const position = utils.panPosition(deltaX, deltaY, this.canvas);
    this.updateCanvas({ position });
  }

  /**
   * Used by keyboard shortcuts to move the canvas in a specific direction
   * @param param0 keyboardEvent
   */
  panTo({ key, shiftKey }: KeyboardEvent) {
    const { x, y, z } = this.canvas.position;
    const changes = movePoint(key, shiftKey, x, y);
    const position = { ...changes, z };
    this.updateCanvas({ position });
  }

  /**
   * Update position when the canvas is dragged via mouse
   * @param x
   * @param y
   */

  drag(x: number, y: number) {
    const { canvas } = this;
    const { z } = canvas.position;
    const position = utils.clampToBounds(x, y, z, canvas);
    this.updateCanvas({ position });
  }

  /**
   * Pinch and zoom behavior called by canvas.component
   * @param clientX
   * @param clientY
   * @param deltaY
   */
  zoom(clientX: number, clientY: number, deltaY: number) {
    this.resetAnimation();
    const { canvas } = this;
    const zoomAmount = canvas.position.z - deltaY * config.ZOOM_MULTIPLIER;
    const position = utils.calculateZoomToPoint(clientX, clientY, zoomAmount, canvas);
    this.updateCanvas({ position });
  }

  /**
   * Zoom In or Out behavior called by an Action
   * @param zoomIn
   */
  zoomInOut(zoomIn: boolean) {
    const { z } = this.canvas.position;
    const from = roundToDecimal(z, 1);
    const to = from * (zoomIn ? config.ZOOM_FACTOR : 1 / config.ZOOM_FACTOR);
    const min = Math.min(from, to);
    const max = Math.max(from, to);
    const crossesThreshold = isBetween(config.DEFAULT_ZOOM, min, max, false);
    const zoomLevel = crossesThreshold ? config.DEFAULT_ZOOM : to;
    this.zoomTo(zoomLevel, true);
  }

  /**
   * Zoom to a specific value
   * @param zoomAmount
   */
  zoomTo(zoomAmount: number, animated = false) {
    const zoom = isNaN(zoomAmount) ? 1 : zoomAmount;
    this.resetAnimation();
    const position = utils.calculateZoomToCenter(zoom, this.canvas);
    if (animated === true) {
      this.moveTo(position);
    } else {
      this.updateCanvas({ position });
    }
  }

  /**
   * Cancel an animation, called on every update
   */
  resetAnimation() {
    window.cancelAnimationFrame(this._animation);
  }

  /**
   * Reset canvas zoom level to default
   */
  resetZoom() {
    const position = utils.calculateZoomToCenter(config.DEFAULT_ZOOM, this.canvas);
    this.moveTo(position);
  }

  get hasBounds() {
    return utils.canvasHasBounds(this.canvas);
  }
  /**
   * Make all boards visible on the canvas
   */
  fitToBounds() {
    this.resetAnimation();
    if (!this.hasBounds) return;
    const position = utils.calculateFitToBounds(this.canvas);
    this.updateCanvas({ position });
  }
  /**
   * Snap to 1 or many selected boards
   * @param boards
   * @param animated
   */
  snapToBoard(boards: IBoardProperties[], animated = true, zoom?: number) {
    const frames = boards.map((board: IBoardProperties) => board.frame);
    const position = utils.calculateZoomToBoards(frames, this.canvas, zoom);
    if (animated) {
      this.moveTo(position);
    } else {
      this.updateCanvas({ position });
    }
  }

  positionsMatch(x: number, y: number, z: number, position: ICanvasPosition) {
    return x === position.x && y === position.y && z === position.z;
  }
  /**
   * Animate a canvas position
   * @param position
   */
  moveTo(position: ICanvasPosition) {
    const { x: sx, y: sy, z: sz } = this.canvas.position;
    const diffX = position.x - sx;
    const diffY = position.y - sy;
    const diffZ = position.z - sz;

    if (diffX === 0 && diffY === 0 && diffZ === 0) return;

    this.resetAnimation();
    this.move(
      EASE_DURATION,
      (time: number) => {
        // Callback function with the time
        const x = sx + diffX * time;
        const y = sy + diffY * time;
        const zp = sz + diffZ * time;
        // Additional check for negative zoom ///
        const z = clamp(zp, 0, config.MAX_ZOOM);
        /////////////////////////////////////////
        if (this.positionsMatch(x, y, zp, position) === true) {
          this.resetAnimation();
        }

        this.updateCanvas({ position: { x, y, z } }, false);
      },
      () => {
        this.updateCanvas({ position: { ...position } }, false);
      }
    );
  }

  /**
   * Start Animation
   * @param duration How long this animation should take
   * @param callback Return current time of the animation
   */
  move(duration: number, callback: (value: number) => void, done: () => void) {
    let startTime = 0;
    const update = (timestamp: number) => {
      if (startTime === 0) startTime = timestamp;
      const time = timestamp - startTime;
      if (time > 0) {
        const position = ease(time / duration);
        callback(position);
        if (time >= duration) {
          done();
          return;
        }
      }
      this._animation = window.requestAnimationFrame(update);
    };

    this._animation = window.requestAnimationFrame(update);
  }

  saveState() {
    const clone = deepCopy(this.canvas);
    this._savedState.push(clone);
  }

  clearSavedState() {
    this._savedState = [];
  }

  restoreSavedState() {
    if (!this._savedState.length) return this.fitToBounds();
    const last = this._savedState[this._savedState.length - 1];
    this.canvas = last;
    this._savedState.pop();
  }
}
