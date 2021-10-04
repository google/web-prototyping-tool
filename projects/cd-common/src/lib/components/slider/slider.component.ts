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
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  HostBinding,
} from '@angular/core';

import { clamp, roundToDecimal, toPercent, countDecimals } from 'cd-utils/numeric';
import { assignGlobalCursor, CursorState } from 'cd-utils/css';
import { KEYS } from 'cd-utils/keycodes';
import { Subscription, fromEvent } from 'rxjs';

@Component({
  selector: 'cd-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderComponent implements AfterViewInit, OnDestroy {
  private _subscriptions = Subscription.EMPTY;
  private _focusSubscription = Subscription.EMPTY;
  private _value = 0;
  private _handleOffset = 8;
  private _handlePosition = 0;
  public active = false;
  public pressed = false;

  @Input() min = 0;
  @Input() max = Number.MAX_SAFE_INTEGER;
  @Input() step = 1;

  @Input()
  @HostBinding('attr.tabindex')
  tabindex = 0;

  get zeroState() {
    return this._value === this.min;
  }

  @Input()
  set value(v: number | null) {
    if (this.pressed) return;
    const val = this.roundValueToNumDecimalsInStep(v);
    if (val === this._value) return;
    this._value = val;
    this.updateHandlePosition();
  }

  @Output() readonly change = new EventEmitter<number>();

  constructor(private _elementRef: ElementRef, private _cdr: ChangeDetectorRef) {}

  removeFocusListeners() {
    this._focusSubscription.unsubscribe();
  }

  @HostListener('focus')
  onFocus() {
    this._focusSubscription = new Subscription();
    const { nativeElement } = this._elementRef;
    const keyDown$ = fromEvent<KeyboardEvent>(nativeElement, 'keydown');
    const wheel$ = fromEvent<WheelEvent>(nativeElement, 'wheel', { passive: true });
    this._focusSubscription.add(keyDown$.subscribe(this.onKeydown));
    this._focusSubscription.add(wheel$.subscribe(this.onWheel));
  }

  @HostListener('blur')
  onBlur() {
    this.removeFocusListeners();
  }

  incrementForKey(key: string): number {
    if (key === KEYS.ArrowLeft || key === KEYS.ArrowUp) return -1;
    if (key === KEYS.ArrowRight || key === KEYS.ArrowDown) return 1;
    return 0;
  }

  onKeydown = (e: KeyboardEvent) => {
    const increment = this.incrementForKey(e.key);
    if (increment) {
      e.preventDefault();
      const { _value: oldValue, max } = this;
      this.value = clamp(oldValue + increment, 0, max);
      if (this._value !== oldValue) this.change.emit(this._value);
    }
  };

  onWheel = (e: WheelEvent) => {
    const { deltaY } = e;
    const speed = 0.05;
    const pos = deltaY * speed;
    const { _value: oldValue } = this;

    this.value = clamp(oldValue + pos, 0, this.max);

    if (this._value !== oldValue) {
      this.change.emit(this._value);
    }
  };

  ngAfterViewInit() {
    this.updateHandlePosition();
    this.active = true;
    this._cdr.markForCheck();
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: MouseEvent) {
    this._removeListeners(e);
  }
  @HostListener('mousedown')
  onDown() {
    this.pressed = true;
    this.active = false;
    assignGlobalCursor(CursorState.EWResize);
    this.addListeners();
  }

  addListeners() {
    this._subscriptions = new Subscription();
    const mouseup$ = fromEvent<MouseEvent>(window, 'mouseup', { capture: true });
    const mouseleave$ = fromEvent<MouseEvent>(window, 'mouseleave');
    const mousemove$ = fromEvent<MouseEvent>(window, 'mousemove');
    this._subscriptions.add(mouseup$.subscribe(this._handleMouseUp));
    this._subscriptions.add(mouseleave$.subscribe(this._removeListeners));
    this._subscriptions.add(mousemove$.subscribe(this._handleMouseMove));
  }

  get sliderDimensions(): DOMRect {
    return this._elementRef.nativeElement.getBoundingClientRect();
  }

  updateHandlePosition() {
    const { max, min, _value } = this;
    this._handlePosition = clamp(toPercent((_value - min) / (max - min)), 0, 100);
  }

  get handlePosition(): number {
    return this._handlePosition;
  }

  _handleMouseUp = (e: MouseEvent) => {
    this._handleMouseMove(e);
    this.active = true;
    this._removeListeners(e);
  };

  updateValue(v: number) {
    const { _value } = this;
    const oldValue = _value;
    this._value = this.roundValueToNumDecimalsInStep(v);
    this.updateHandlePosition();
    this._cdr.markForCheck();
    if (this._value !== oldValue) {
      this.change.emit(this._value);
    }
  }

  _handleMouseMove = (e: MouseEvent) => {
    const { clientX } = e;
    const { max, min, sliderDimensions } = this;
    const { left, width } = sliderDimensions;
    const { _handleOffset } = this;
    const w = width - _handleOffset * 2;
    const x = clientX - left - _handleOffset;
    const xp = clamp(x, 0, w);
    const v = min + ((max - min) * xp) / w;
    this.updateValue(v);
  };

  private _removeListeners = (e?: MouseEvent): void => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (this.pressed) {
      assignGlobalCursor();
    }

    this.pressed = false;
    this._subscriptions.unsubscribe();
    this._cdr.markForCheck();
  };

  ngOnDestroy() {
    this._removeListeners();
    this.removeFocusListeners();
  }

  private roundValueToNumDecimalsInStep = (value?: number | null): number => {
    const { step, min } = this;
    if (value === null || value === undefined) value = min;
    const numDecimalsInStep = countDecimals(step);
    const minVal = value || min;
    return roundToDecimal(minVal, numDecimalsInStep);
  };
}
