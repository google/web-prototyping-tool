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
  ChangeDetectionStrategy,
  HostListener,
  Input,
  HostBinding,
  AfterViewInit,
  ChangeDetectorRef,
  ElementRef,
  OnDestroy,
  EventEmitter,
  Output,
} from '@angular/core';
import { translate } from 'cd-utils/css';
import { Subscription, fromEvent } from 'rxjs';
import { clamp } from 'cd-utils/numeric';

const BOX_WIDTH = 204;
const BOX_HEIGHT = 95;
export interface IHSV {
  saturation: number;
  value: number;
}
@Component({
  selector: 'cd-hsv-box',
  templateUrl: './hsv-box.component.html',
  styleUrls: ['./hsv-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsvBoxComponent implements AfterViewInit, OnDestroy {
  private _subscription = new Subscription();

  public active = false;
  public cursorPosition = '';

  @Input() dragging = false;
  @Output() draggingChange = new EventEmitter<boolean>();

  @Input()
  @HostBinding('style.background')
  hsla = '';

  @Input() rgbaString = '';

  @Input()
  public set hsv(hsv: IHSV) {
    const { value, saturation } = hsv;
    this.setCursorPosition(value, saturation);
  }

  @Output() valueChange = new EventEmitter<IHSV>();

  setDragging(dragging: boolean) {
    this.dragging = dragging;
    this.draggingChange.emit(dragging);
  }

  @HostListener('mousedown', ['$event'])
  onmousedown(e: MouseEvent) {
    this._subscription = new Subscription();
    this.setDragging(true);

    const mouseUp = fromEvent<MouseEvent>(window, 'mouseup', { capture: true });
    const mouseLeave = fromEvent<MouseEvent>(window, 'mouseleave');
    const mouseMove = fromEvent<MouseEvent>(window, 'mousemove');
    this._subscription.add(mouseUp.subscribe(this.onUnsubscribe));
    this._subscription.add(mouseLeave.subscribe(this.onUnsubscribe));
    this._subscription.add(mouseMove.subscribe(this.onBoxMouseMove));
    this.onBoxMouseMove(e);
  }

  private updateColorSV(saturation: number, value: number) {
    this.valueChange.emit({ saturation, value });
    this.setCursorPosition(value, saturation);
    this._cdRef.markForCheck();
  }

  private onBoxMouseMove = (e: MouseEvent): void => {
    const { _boxDimensions } = this;
    const { clientX, clientY } = e;
    const { top, left } = _boxDimensions;
    const xp = clamp(clientX - left, 0, BOX_WIDTH);
    const yp = clamp(clientY - top, 0, BOX_HEIGHT);
    this.updateColorSV(xp / BOX_WIDTH, 1 - yp / BOX_HEIGHT);
  };

  constructor(private _cdRef: ChangeDetectorRef, private _elementRef: ElementRef) {}

  onUnsubscribe = (e: MouseEvent) => {
    this.setDragging(false);
    e.preventDefault();
    e.stopPropagation();
    this._subscription.unsubscribe();
  };

  ngAfterViewInit(): void {
    this.active = true;
    this._cdRef.markForCheck();
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  private get _boxDimensions(): DOMRect {
    return this._elementRef.nativeElement.getBoundingClientRect();
  }

  setCursorPosition(value: number, saturation: number) {
    const x = saturation * BOX_WIDTH;
    const y = (1 - value) * BOX_HEIGHT;
    this.cursorPosition = translate(x, y);
  }
}
