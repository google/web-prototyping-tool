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

import { InteractionService } from '../../services/interaction/interaction.service';
import { Directive, OnDestroy, Input, HostListener } from '@angular/core';
import { areObjectsEqual } from 'cd-utils/object';
import { IPoint, approxDist, createPoint } from 'cd-utils/geometry';
import { assignGlobalCursor, CursorState } from 'cd-utils/css';
import { Subscription, fromEvent } from 'rxjs';
import { MouseButton } from 'cd-utils/keycodes';

const OUTLET_TAG_NAME = 'outlet-frame';
@Directive({
  selector: '[appOutletFrameMove]',
})
export class OutletFrameMoveDirective implements OnDestroy {
  private _subscriptions = Subscription.EMPTY;
  private _lastPosition: IPoint = createPoint();
  private _startPosition: IPoint = this._lastPosition;
  private _startedMoving = false;

  @Input() zoom = 1;
  @Input() outletFrameId!: string;

  constructor(private _interactionService: InteractionService) {}

  stopPropagation = (e: MouseEvent) => {
    e.stopPropagation();
  };

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const isBoardElement = target.classList.contains(OUTLET_TAG_NAME);
    // Ignore if contextmenu
    if (e.button === MouseButton.Left && (this.isOutletFrameSelected || !isBoardElement)) {
      e.preventDefault();
      // NOTE: Breaks e2e
      // e.stopImmediatePropagation();
      const { clientX, clientY } = e;
      this.addListeners();
      this.setLastPosition(clientX, clientY);
      this.setStartPosition(clientX, clientY);
    }
  }

  setStartPosition(x: number, y: number) {
    this._startPosition = { x, y };
  }

  setLastPosition(x: number, y: number) {
    this._lastPosition = { x, y };
  }

  get isOutletFrameSelected(): boolean {
    return this._interactionService.isSelected(this.outletFrameId);
  }

  checkSelectionState(e: MouseEvent) {
    if (!this.isOutletFrameSelected) return this.onMouseUpOrLeaveForMove(e);
  }

  onMouseMove = (e: MouseEvent) => {
    this.checkSelectionState(e);
    e.stopPropagation();
    const { clientX, clientY } = e;
    const { _lastPosition, zoom, _startedMoving } = this;
    if (_startedMoving === false) {
      const distance = approxDist(this._startPosition, _lastPosition);
      if (distance > 1) {
        this._interactionService.boardMoving$.next(true);
        this._interactionService.startInteracting();
        this._startedMoving = true;
      }
    }

    const { x, y } = _lastPosition;
    const deltaX = clientX - x;
    const deltaY = clientY - y;
    const dx = deltaX / zoom;
    const dy = deltaY / zoom;
    this._interactionService.moveOutletFrame(dx, dy, clientX, clientY, zoom);

    this.setLastPosition(clientX, clientY);
    assignGlobalCursor(CursorState.Grabbing);
  };

  onMouseUpOrLeaveForMove = (e: MouseEvent) => {
    assignGlobalCursor(CursorState.Default);
    this.stopPropagation(e);
    this.removeListeners();
    this._startedMoving = false;
    const isEqual = areObjectsEqual(this._lastPosition, this._startPosition);
    const changed = isEqual === false;
    this._interactionService.endOutletFrameMove(changed);
  };

  addListeners() {
    this._subscriptions = new Subscription();
    const config = { capture: true };
    const click = fromEvent<MouseEvent>(window, 'click', config);
    const up = fromEvent<MouseEvent>(window, 'mouseup');
    const leave = fromEvent<MouseEvent>(window, 'mouseleave');
    const move = fromEvent<MouseEvent>(window, 'mousemove');
    this._subscriptions.add(click.subscribe(this.stopPropagation));
    this._subscriptions.add(up.subscribe(this.onMouseUpOrLeaveForMove));
    this._subscriptions.add(leave.subscribe(this.onMouseUpOrLeaveForMove));
    this._subscriptions.add(move.subscribe(this.onMouseMove));
  }

  ngOnDestroy(): void {
    this.removeListeners();
  }

  removeListeners() {
    this._subscriptions.unsubscribe();
  }
}
