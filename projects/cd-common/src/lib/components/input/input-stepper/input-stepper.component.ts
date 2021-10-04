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

import { Component, ChangeDetectionStrategy, Output, EventEmitter, OnDestroy } from '@angular/core';
import { deselectActiveElement } from 'cd-utils/selection';
import { Subscription, fromEvent, merge } from 'rxjs';
import { filter, distinctUntilChanged, map } from 'rxjs/operators';
import { KEYS } from 'cd-utils/keycodes';

const STEPPER_SPEED = 180;
const KEYDOWN_EVENT = 'keydown';
const KEYUP_EVENT = 'keyup';
const MOUSEUP_EVENT = 'mouseup';

export interface IStepperChange {
  increment: boolean;
  shiftKey: boolean;
}

@Component({
  selector: 'svg[cd-input-stepper]',
  templateUrl: './input-stepper.component.svg',
  styleUrls: ['./input-stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputStepperComponent implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _shiftKeyDown = false;
  private _increment = false;
  private _timer = 0;

  @Output() stepChange = new EventEmitter<IStepperChange>();

  emitChanges = () => {
    const shiftKey = this._shiftKeyDown;
    const increment = this._increment;
    this.stepChange.emit({ increment, shiftKey });
  };

  startTimer(e: MouseEvent, increment: boolean) {
    deselectActiveElement();
    e.preventDefault();
    e.stopPropagation();
    this._shiftKeyDown = e.shiftKey;
    this._increment = increment;
    window.clearInterval(this._timer);
    this._timer = window.setInterval(this.emitChanges, STEPPER_SPEED);
    this.addEvents();
    this.emitChanges();
  }

  addEvents() {
    this._subscription = fromEvent(window, MOUSEUP_EVENT).subscribe(this.onReset);
    const keydown$ = fromEvent<KeyboardEvent>(window, KEYDOWN_EVENT);
    const keyup$ = fromEvent<KeyboardEvent>(window, KEYUP_EVENT);
    this._subscription.add(
      merge(keydown$, keyup$)
        .pipe(
          filter((e: KeyboardEvent) => e.key === KEYS.Shift),
          distinctUntilChanged((x, y) => x.type === y.type),
          map((value) => value.type === KEYDOWN_EVENT)
        )
        .subscribe(this.onShiftKey)
    );
  }

  onShiftKey = (value: boolean) => {
    this._shiftKeyDown = value;
  };

  onIncrement(e: MouseEvent) {
    this.startTimer(e, true);
  }

  onDecrement(e: MouseEvent) {
    this.startTimer(e, false);
  }

  onReset = () => {
    window.clearInterval(this._timer);
    this._subscription.unsubscribe();
  };

  ngOnDestroy(): void {
    this.onReset();
  }
}
