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

import { Directive, ElementRef, HostBinding, Input, OnDestroy } from '@angular/core';
import { InputType } from 'cd-interfaces';
import { fromEvent, merge, Subscription } from 'rxjs';
import { distinctUntilChanged, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { assignGlobalCursor } from 'cd-utils/css';
import { InputComponent } from './input.component';
import { clamp } from 'cd-utils/numeric';

/** This directive attaches east / west cursor resize to update an input.component's numeric value  */
@Directive({
  selector: '[cdDragRange]',
})
export class DragRangeDirective implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _valid = false;
  private _oldValue = 0;

  /** Pass in inputType to active dragRange, only numeric values will update */
  @Input() set cdDragRange(type: InputType) {
    const valid = this.isValid(type);
    if (valid === this._valid) return;
    this._valid = valid;
    this.setupSubscription(valid);
  }

  @HostBinding('class.drag-range')
  get enabled() {
    return this._input.disabled === false && this._valid;
  }

  constructor(private _elemRef: ElementRef, private _input: InputComponent) {}

  get element() {
    return this._elemRef.nativeElement;
  }

  isValid(type: InputType) {
    return type === InputType.Number || type === InputType.Percent;
  }

  releasePointer = (e: PointerEvent) => {
    const ct = e.currentTarget as HTMLElement;
    ct.releasePointerCapture(e.pointerId);
    assignGlobalCursor();
  };

  diffPointerValue = (e: PointerEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    const diff = Math.round(e.pageX - this._oldValue);
    this._oldValue = e.pageX;
    return diff;
  };

  setupSubscription(valid: boolean) {
    if (!valid) return this.cleanup();

    const { element } = this;
    const cancel$ = merge(
      fromEvent<PointerEvent>(element, 'pointerup'),
      fromEvent<PointerEvent>(element, 'pointercancel'),
      fromEvent<PointerEvent>(element, 'pointerleave')
    ).pipe(tap(this.releasePointer), take(1));

    const down$ = fromEvent<PointerEvent>(element, 'pointerdown', { capture: true });
    const move$ = fromEvent<PointerEvent>(element, 'pointermove').pipe(takeUntil(cancel$));

    this._subscription = down$
      .pipe(
        switchMap((e: PointerEvent) => {
          this._oldValue = e.pageX;
          const currentTarget = e.currentTarget as HTMLElement;
          currentTarget.setPointerCapture(e.pointerId);
          return move$;
        }),
        map(this.diffPointerValue),
        distinctUntilChanged()
      )
      .subscribe(this.onPointerMove);
  }

  onPointerMove = (val: number) => {
    const { value, min, max } = this._input;
    const currentValue = Number(value);
    const pos = currentValue + val;
    const update = clamp(pos, min, max);
    this._input.change.emit(update);
  };

  cleanup() {
    this._subscription.unsubscribe();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
