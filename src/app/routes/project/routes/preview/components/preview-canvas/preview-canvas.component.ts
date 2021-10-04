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

/// <reference types="resize-observer-browser" />

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  HostBinding,
  OnChanges,
  SimpleChanges,
  SimpleChange,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ICommentsState } from '../../../../store/reducers/comment-threads.reducer';
import { Subscription } from 'rxjs';
import { LayerMode } from './preview-glass-layer/preview-glass-layer.component';
import { Route } from 'src/app/configs/routes.config';
import * as cd from 'cd-interfaces';

const DEFAULT_PADDING = 20;

@Component({
  selector: 'app-preview-canvas',
  templateUrl: './preview-canvas.component.html',
  styleUrls: ['./preview-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewCanvasComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  private _resizeObserver: ResizeObserver;
  private _subscription = Subscription.EMPTY;
  private _scale = 1;
  private _hostWidth = 0;
  private _hostHeight = 0;

  public paddingOffset = DEFAULT_PADDING;
  public adjustedScale = 1;

  @Input() boardId = '';
  @Input() commentState?: ICommentsState;
  @Input() currentSelectedElementId?: string;
  @Input() embedMode?: boolean;
  @Input() flowEnabled?: boolean;
  @Input() glassLayerMode?: LayerMode;
  @Input() headingsEnabled?: boolean;
  @Input() isEmbedMode?: boolean;
  @Input() landmarksEnabled?: boolean;
  @Input() projectUrl = '';
  @Input() props?: cd.ElementPropertiesMap;
  @Input() rotation = false;
  @Input() showBadge?: boolean | cd.EmbedBadgePosition;
  @Input() showPreviewGlassLayer = false;
  @Input() width = 100;
  @Input() height = 100;

  @HostBinding('class.component')
  @Input()
  isComponent = false;

  @HostBinding('class.fullscreen')
  @Input()
  fullscreen = false;

  @HostBinding('class.fit')
  @Input()
  fitToScreen = false;

  @HostBinding('class.scale-fit')
  @Input()
  scaleToFit = false;

  @Input()
  set scale(value) {
    this._scale = value;
  }

  get scale() {
    return this.scaleToFit ? this.adjustedScale : this._scale;
  }

  constructor(private _cdRef: ChangeDetectorRef, private _elem: ElementRef) {
    this._resizeObserver = new ResizeObserver(this.onResize);
  }

  get element() {
    return this._elem.nativeElement;
  }

  get scaledWidth() {
    return this.width * this.scale;
  }

  get scaledHeight() {
    return this.height * this.scale;
  }

  get scaleTransform() {
    return `scale(${this.scale})`;
  }

  get previewURL() {
    return `${this.projectUrl}/${Route.Preview}`;
  }

  get showOpenInBadge() {
    const { showBadge, embedMode } = this;
    return embedMode && !!showBadge;
  }

  get embedBadgePosition(): cd.EmbedBadgePosition {
    return (this.showBadge as cd.EmbedBadgePosition) || cd.EmbedBadgePosition.TopRight;
  }

  ngAfterViewInit(): void {
    this.handleResize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.fullscreen) this.onFullscreenChange(changes.fullscreen);
    if (changes.width || changes.height || changes.rotation || changes.fitScale) {
      this.handleResize();
    }
  }

  onResize = ([entry]: ResizeObserverEntry[]) => {
    const { width, height } = entry.contentRect;
    this._hostWidth = width;
    this._hostHeight = height;
    this.handleResize();
  };

  handleResize() {
    const { _hostHeight, _hostWidth, width, height } = this;
    const padd = DEFAULT_PADDING * 2;
    const scaleWidth = width / (_hostWidth - padd);
    const scaledHeight = height / (_hostHeight - padd);
    const scale = scaleWidth > scaledHeight ? scaleWidth : scaledHeight;
    const value = 1 / scale; // clamp(1 / scale, 0, 1);
    this.adjustedScale = value;
    this._cdRef.markForCheck();
  }

  ngOnInit(): void {
    this._resizeObserver.observe(this.element);
  }

  ngOnDestroy(): void {
    this._resizeObserver.disconnect();
    this._subscription.unsubscribe();
  }

  private onFullscreenChange(fullscreenChange: SimpleChange) {
    const { currentValue, previousValue } = fullscreenChange;
    const fullscreen = coerceBooleanProperty(currentValue);
    const oldFullscreen = coerceBooleanProperty(previousValue);
    if (oldFullscreen === fullscreen) return;
    this.paddingOffset = fullscreen ? 0 : DEFAULT_PADDING;
  }
}
