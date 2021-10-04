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
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
} from '@angular/core';
import { ISelectItem } from 'cd-interfaces';
import {
  HSVColor,
  GradientMode,
  IGradientStop,
  isGradient,
  parseGradient,
  generateStopsForColor,
} from 'cd-utils/color';
import { KEYS } from 'cd-utils/keycodes';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { clamp, toPercent } from 'cd-utils/numeric';
import { Subscription, merge, fromEvent } from 'rxjs';
import * as utils from './gradient.utils';

const DIST_MULTIPLIER = 0.4;
const DEFAULT_ANGLE = 90;
const DELETE_THRESHOLD = 30;
const HANDLE_OFFSET = 6;
const DEFAULT_COLOR = 'rgb(0,0,0)';
const DEFAULT_STOP_SPREAD = [0, 100];
const DEFAULT_STOPS: IGradientStop[] = generateStopsForColor(DEFAULT_COLOR, DEFAULT_STOP_SPREAD);

@Component({
  selector: 'cd-gradient',
  templateUrl: './gradient.component.html',
  styleUrls: ['./gradient.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradientComponent implements OnInit, OnDestroy {
  private _ctx?: OffscreenCanvasRenderingContext2D;
  private _selectedStop = 0;
  private _subscription = new Subscription();
  private _dragPointerId?: number;
  private _startY = 0;

  public angle = DEFAULT_ANGLE;
  public deleteDistance = 1;
  public mode: GradientMode = GradientMode.Linear;
  public stops: IGradientStop[] = [];
  public gradientMenu: ISelectItem[] = [];
  public passedDeleteThreshold = false;

  @Input()
  set color(color: string) {
    if (!color) return;
    const hasGradient = isGradient(color);
    const parsedGradient = hasGradient && parseGradient(color);
    const colorIsValid = CSS.supports('background-color', color);
    const baseColor = colorIsValid ? color : DEFAULT_COLOR;
    this.selectedStop = 0;
    if (parsedGradient) {
      const { angle, mode, stops } = parsedGradient;
      this.angle = angle;
      this.mode = mode;
      this.stops = stops.length >= 2 ? stops : DEFAULT_STOPS;
    } else {
      this.angle = DEFAULT_ANGLE;
      this.mode = GradientMode.Linear;
      this.stops = generateStopsForColor(baseColor, DEFAULT_STOP_SPREAD);
    }
    this.updateColor();
  }

  @ViewChild('trackRef', { read: ElementRef, static: true }) _trackRef!: ElementRef;
  @ViewChild('btnTrackRef', { read: ElementRef, static: true }) _btnTrackRef!: ElementRef;

  @Output() selectedColor = new EventEmitter<string>();
  @Output() gradientChange = new EventEmitter<string>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  get ctx(): OffscreenCanvasRenderingContext2D {
    if (this._ctx) return this._ctx;
    this._ctx = utils.createOffscrenCanvas();
    return this._ctx;
  }

  set selectedStop(index: number) {
    if (this._selectedStop === index) return;
    this._selectedStop = index;
    this.selectedColor.emit(this.stops[index].color);
  }
  get selectedStop() {
    return this._selectedStop;
  }

  colorAtPoint(percent: number) {
    const { ctx, stops } = this;
    return utils.sampleGradientInCanvasAtPoint(ctx, stops, percent);
  }

  get gradientTrack() {
    return utils.gradientString(GradientMode.Linear, this.stops, DEFAULT_ANGLE);
  }

  get gradientValue() {
    const { angle, stops, mode } = this;
    return utils.buildGradientString(mode, stops, angle);
  }

  updateColor() {
    this._trackRef.nativeElement.style.background = this.gradientTrack;
    const selectedColor = this.stops[this._selectedStop].color;
    this.selectedColor.emit(selectedColor);
    this._cdRef.detectChanges();
  }

  ngOnInit(): void {
    this.updateColor();
  }

  get activeColor(): string {
    return this.stops[this.selectedStop].color;
  }

  onGradientMenuChange(mode: GradientMode) {
    this.mode = mode;
    this.gradientChange.emit(this.gradientValue);
  }

  onAngleChange(angle: number) {
    this.angle = angle;
    this.gradientChange.emit(this.gradientValue);
  }

  onSelectStop(i: number) {
    if (i === this.selectedStop) return;
    this.selectedStop = i;
    this._cdRef.markForCheck();
  }

  onColorChange(color: HSVColor) {
    this.stops[this.selectedStop].color = color.rgbaString;
    this.updateColor();
    this.gradientChange.emit(this.gradientValue);
  }

  onTrackClick(e: MouseEvent) {
    const { currentTarget, clientX } = e;
    const track = currentTarget as HTMLElement;
    const { width, left } = track.getBoundingClientRect();
    const percent = (clientX - left) / width;
    const stop = toPercent(percent);
    const { stops } = this;
    const existingStopAtIndex = stops.findIndex((item) => item.stop === stop);
    if (existingStopAtIndex !== -1) {
      this.onSelectStop(existingStopAtIndex);
      return;
    }

    const sorted = stops.sort((a, b) => (a.stop > b.stop ? 1 : -1));
    const nextIdx = sorted.findIndex((item) => item.stop > stop);
    const addIndex = nextIdx === -1 ? sorted.length - 1 : nextIdx;
    const color = this.colorAtPoint(percent);
    const addedStop = { stop, color };
    const updatedStops = stops.reduce<IGradientStop[]>((acc, curr, idx) => {
      if (idx === addIndex) acc.push(addedStop);
      acc.push({ ...curr });
      return acc;
    }, []);

    this.stops = updatedStops;
    this.selectedStop = addIndex;

    this.updateColor();
    this._cdRef.detectChanges();
    this.focusOnSelectedStop();
    this.gradientChange.emit(this.gradientValue);
  }

  deleteStopAtIndex(idx: number) {
    // Must have at least 2 points
    if (this.stops.length === 2) return;

    this.stops = removeValueFromArrayAtIndex(idx, this.stops);
    const len = this.stops.length;
    if (this.selectedStop >= len) {
      const updatedIndex = clamp(len - 1, 0, this.stops.length);
      this.selectedStop = updatedIndex;
    }

    this.updateColor();
    this._cdRef.detectChanges();
    this.focusOnSelectedStop();
    this.gradientChange.emit(this.gradientValue);
  }

  focusOnSelectedStop() {
    const btn = this._btnTrackRef.nativeElement.children[this.selectedStop];
    btn.focus();
  }

  onKeydown(e: KeyboardEvent, idx: number) {
    const { key } = e;
    if (key === KEYS.Delete || key === KEYS.Backspace) {
      e.preventDefault();
      this.deleteStopAtIndex(idx);
    }
  }

  activeScale(idx: number) {
    // Used to shrink gradient stop on drag away
    const scale = idx === this.selectedStop ? this.deleteDistance : 1;
    return `scale(${scale})`;
  }

  updateDeleteDistance(dist: number) {
    const diff = 1 - (dist * DIST_MULTIPLIER) / DELETE_THRESHOLD;
    this.deleteDistance = clamp(diff, 0, 1);
    this._cdRef.markForCheck();
  }

  private _handleDrag = (e: PointerEvent): void => {
    const { clientX, clientY } = e;

    if (this.stops.length > 2) {
      const dist = Math.abs(this._startY - clientY);
      this.updateDeleteDistance(dist);
      const pastThreshold = dist > DELETE_THRESHOLD;
      this.passedDeleteThreshold = pastThreshold;
      if (pastThreshold) return;
    }

    const { width, left } = this._trackRef.nativeElement.getBoundingClientRect();

    const w = width - HANDLE_OFFSET * 2;
    const percent = (clientX - left - HANDLE_OFFSET) / w;
    const value = toPercent(percent);
    const updatedStop = clamp(value, 0, 100);
    const { selectedStop, stops } = this;
    if (stops.find((item) => item.stop === updatedStop)) return;

    const update = stops.map((item, idx) => {
      const clone = { ...item };
      if (idx === selectedStop) {
        clone.stop = updatedStop;
      }
      return clone;
    });

    const sorted = update.sort((a, b) => (a.stop > b.stop ? 1 : -1));

    this.stops = sorted;

    this.selectedStop = sorted.findIndex((item) => item.stop === updatedStop);
    this.updateColor();
    this.gradientChange.emit(this.gradientValue);
    this._cdRef.markForCheck();
  };

  onStopDown(e: PointerEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    this.onSelectStop(idx);

    this._subscription = new Subscription();
    const { pointerId, clientY } = e;
    this._startY = clientY;
    this._dragPointerId = pointerId;
    document.body.setPointerCapture(pointerId);

    this._subscription.add(
      merge(
        fromEvent<PointerEvent>(document, 'pointerup'),
        fromEvent<PointerEvent>(document, 'pointerleave'),
        fromEvent<PointerEvent>(document, 'lostpointercapture')
      ).subscribe(this._onDragEnd)
    );

    const move$ = fromEvent<PointerEvent>(document, 'pointermove');
    this._subscription.add(move$.subscribe(this._handleDrag));
  }

  _onDragEnd = (e: PointerEvent): void => {
    e.stopPropagation();
    if (this.passedDeleteThreshold) {
      this.deleteStopAtIndex(this.selectedStop);
      this.passedDeleteThreshold = false;
    }

    this.deleteDistance = 1;
    this._cdRef.markForCheck();
    this.focusOnSelectedStop();
    if (this._dragPointerId !== undefined) {
      document.body.releasePointerCapture(this._dragPointerId);
    }

    this._removeListeners();
  };

  private _removeListeners = (): void => {
    this._subscription.unsubscribe();
  };

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
