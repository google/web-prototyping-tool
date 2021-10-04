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
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
} from '@angular/core';
import { fromEvent, merge, Subscription } from 'rxjs';

@Directive({
  selector: '[cdResizer]',
})
export class ResizerDirective implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _startPos = 0;
  private _size = 0;

  @Output() resizeChange = new EventEmitter<number>();
  @Output() resizeStart = new EventEmitter<void>();
  @Output() resizeEnd = new EventEmitter<void>();

  constructor(private _elemRef: ElementRef) {}

  get bounds() {
    return this._elemRef.nativeElement.parentElement.getBoundingClientRect();
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(e: PointerEvent) {
    this._startPos = e.clientY;
    this._size = this.bounds.height;

    this._subscription = new Subscription();
    const currentTarget = e.currentTarget as HTMLElement;
    currentTarget.setPointerCapture(e.pointerId);
    const up$ = fromEvent<PointerEvent>(currentTarget, 'pointerup');
    const cancel$ = fromEvent<PointerEvent>(currentTarget, 'pointercancel');
    const leave$ = fromEvent<PointerEvent>(currentTarget, 'pointerleave');
    const move$ = fromEvent<PointerEvent>(currentTarget, 'pointermove');
    this._subscription.add(merge(up$, leave$, cancel$).subscribe(this.onResizeCancel));
    this._subscription.add(move$.subscribe(this.onResize));
    this.resizeStart.emit();
  }

  onResize = (e: PointerEvent) => {
    const { _startPos, _size } = this;
    const value = _size - _startPos + e.clientY;
    this.resizeChange.emit(value);
  };

  onResizeCancel = (e: PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    this._subscription.unsubscribe();
    this.resizeEnd.emit();
  };

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
