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

/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
/* eslint-disable @angular-eslint/use-lifecycle-interface */
import {
  ChangeDetectionStrategy,
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  forwardRef,
  Inject,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Input,
  HostBinding,
  HostListener,
  AfterContentInit,
  AfterViewInit,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { OverlayInitService } from './overlay.init.service';
import { pathFromParentRect, getChildBounds, calculateOverlayPosition } from './overlay.utils';
import { Position } from 'cd-interfaces';
import { clamp } from 'cd-utils/numeric';
import { IOverlayConfig } from './overlay.service';

@Component({
  selector: 'cd-overlay-wrapper',
  styleUrls: ['./overlay.wrapper.scss'],
  templateUrl: './overlay.wrapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayWrapperComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit {
  private _subscriptions = new Subscription();
  public contentStyle: Record<string, string> = {};
  public svgClippingPath?: string;
  public initialized = false;
  public alignBottom = false;
  public transformOrigin = 'top left';
  public modal = false;

  @HostBinding('class.fullscreen')
  @Input()
  fullscreen = false;
  // Used to update the clipping recangle
  @Input() set overrideParentRectWidth(value: number) {
    if (this.config && this.config.parentRect) {
      this.config.parentRect.width = value;
      this.generateSVGClippingPath();
      this._cdRef.detectChanges();
    }
  }

  @Input() set overrideTop(value: number) {
    if (!this.config || !this.config.x) return;

    const { innerHeight } = window;
    const { bottom } = this.contentElem.getBoundingClientRect();

    if (bottom + value < innerHeight) {
      this.updateContentStyle(this.config.x, value);
      this._cdRef.detectChanges();
    }
  }

  @Input() config?: IOverlayConfig;

  @Output() close = new EventEmitter<boolean>();
  @Output() prepareForClose = new EventEmitter<void>();

  @ViewChild('contentRef', { read: ElementRef, static: true }) _contentRef!: ElementRef;
  @ViewChild('svgRef', { read: ElementRef, static: true }) _svgRef!: ElementRef;

  constructor(
    private _cdRef: ChangeDetectorRef,
    @Inject(forwardRef(() => OverlayInitService)) private _overlayInit: OverlayInitService
  ) {
    this._cdRef.detach();
  }

  get contentElem(): HTMLElement {
    return this._contentRef.nativeElement as HTMLElement;
  }

  get svgElem(): SVGElement {
    return this._svgRef.nativeElement as SVGElement;
  }

  ngAfterViewInit(): void {}
  ngAfterContentInit(): void {}

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  dismissOverlay = (key?: boolean) => this.close.emit(key);

  onEscKeyUp(): void {
    this.dismissOverlay(true);
  }

  @HostListener('contextmenu', ['$event'])
  @HostListener('click', ['$event'])
  onClick(e: MouseEvent) {
    const { contentElem, svgElem } = this;
    const targetElem = e.target as HTMLElement;
    if (svgElem.contains(targetElem) || targetElem === contentElem) {
      e.preventDefault();
      this.dismissOverlay();
    }
  }

  loadedSubscription = (): void => {
    this.generateSVGClippingPath();
    this.generateContentStyle();
    this.focusOnContent();
    this.initialized = true;
    this._overlayInit.initialized(this.alignBottom);
    this._cdRef.detectChanges();
  };

  updateConfig = (config?: IOverlayConfig): void => {
    this.config = config;
    this.generateSVGClippingPath();
    this.generateContentStyle();
    this._cdRef.detectChanges();
  };

  focusOnContent() {
    const canFocus = !!(this.config && !this.config.disableAutoFocus);
    if (!canFocus) return;
    if (this.modal) {
      // Timeout only needed for modals
      setTimeout(() => this._contentRef.nativeElement.focus(), 0);
    } else {
      this._contentRef.nativeElement.focus();
    }
  }

  ngOnInit() {
    this._subscriptions.add(this._overlayInit.childLoaded.subscribe(this.loadedSubscription));
    const windowResize = fromEvent(window, 'resize', { passive: true });
    this._subscriptions.add(windowResize.subscribe(this.resizeSubscription));
  }

  resizeSubscription = () => {
    if (this.fullscreen) return;
    if (this.modal) return;
    this.dismissOverlay();
  };

  updateTransformOrigin(bottom: boolean, right: boolean) {
    const vert = bottom ? Position.Bottom : Position.Top;
    const horz = right ? Position.Right : Position.Left;
    this.transformOrigin = `${vert} ${horz}`;
  }

  updateContentStyle(x: number, y: number, height?: number) {
    const { transformOrigin } = this;
    this.contentStyle = {
      'left.px': String(x),
      'top.px': String(y),
      'height.px': String(height),
      transformOrigin,
    };
  }

  generateStyleFromCoordinates() {
    if (!this._contentRef) return;
    const bounds = getChildBounds(this._contentRef.nativeElement);
    const { width, height } = bounds;
    const pos = calculateOverlayPosition(
      width,
      height,
      this.config?.x,
      this.config?.y,
      this.config?.alignRight
    );
    this.updateContentStyle(...pos);
  }

  generateStyleFromParentRect(parentRect: DOMRect): void {
    const { config, _contentRef } = this;
    if (!this._contentRef) return;
    const { width: w, height: h } = getChildBounds(_contentRef.nativeElement);
    const { innerWidth, innerHeight } = window;
    const { top, left, width, height } = parentRect;
    const x = left;
    const y = top + height;
    const alignBottom = config?.alignBottom || y + h > innerHeight;
    const alignRight = config?.alignRight || x + w > innerWidth;
    const xOffset = config?.xOffset ?? 0;
    const yOffset = config?.yOffset ?? 0;
    const xp = alignRight ? left - w + width - xOffset : x + xOffset;
    const yp = alignBottom ? clamp(top - h - yOffset, 0, innerHeight) : y + yOffset;
    // Align bottom is used by select dropdown (autocomplete) to align and filter
    this.alignBottom = alignBottom;
    this.updateTransformOrigin(alignBottom, alignRight);
    this.updateContentStyle(xp, yp, h);
  }

  generateContentStyle(): void {
    const { config } = this;
    if (config && config.parentRect) return this.generateStyleFromParentRect(config.parentRect);
    if (config && (config.x || config.y)) return this.generateStyleFromCoordinates();
    this.modal = true;
  }

  generateSVGClippingPath() {
    this.svgClippingPath = pathFromParentRect(this.config);
  }
}
