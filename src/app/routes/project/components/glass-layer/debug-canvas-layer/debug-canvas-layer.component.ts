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
  OnDestroy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CanvasService } from '../../../services/canvas/canvas.service';
import { BOUNDS_PADDING } from '../../../configs/canvas.config';
import { IRect, ICanvas } from 'cd-interfaces';
import { clamp } from 'cd-utils/numeric';
import { generateFrame } from 'cd-common/utils';

@Component({
  selector: 'g[app-debug-canvas-layer]',
  templateUrl: './debug-canvas-layer.component.html',
  styleUrls: ['./debug-canvas-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebugCanvasLayerComponent implements OnDestroy, OnInit {
  private _subscriptions = Subscription.EMPTY;
  public canvasBounds?: IRect;
  public canvasBoundsWithPadding?: IRect;
  public canvas?: ICanvas;
  public canvasScale = '';
  constructor(private _canvasService: CanvasService, private _cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this._subscriptions = this._canvasService.canvas$.subscribe(this.canvasUpdate);
  }

  canvasUpdate = (canvas: ICanvas) => {
    this.canvas = canvas;
    this.canvasBounds = generateFrame(...canvas.bounds);
    // Padding
    const [x, y, width, height] = canvas.bounds;
    const { z } = canvas.position;
    const padding = BOUNDS_PADDING / z;
    const doublePadding = padding * 2;
    const px = clamp(x + padding, x, x + width);
    const py = clamp(y + padding, y, y + height);
    const pw = clamp(width - doublePadding, 0, width);
    const ph = clamp(height - doublePadding, 0, height);
    this.canvasBoundsWithPadding = generateFrame(px, py, pw, ph);
    const scale = 1 / z;
    this.canvasScale = `scale(${scale} ${scale})`;
    this._cdRef.markForCheck();
  };

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }
}
