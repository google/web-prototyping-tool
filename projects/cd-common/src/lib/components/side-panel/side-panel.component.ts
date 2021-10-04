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

import { clamp } from 'cd-utils/numeric';
import { Position } from 'cd-interfaces';
import { AUTO_VALUE } from 'cd-common/consts';
import { assignGlobalCursor, CursorState, CursorStateType } from 'cd-utils/css';
import {
  Component,
  OnInit,
  Input,
  Output,
  OnDestroy,
  HostBinding,
  EventEmitter,
  Directive,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TemplateRef,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Subscription, fromEvent, merge, ReplaySubject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';

/**
 * Panel Header used as a selector
 */

@Directive({
  selector: '[cdPanelHeader]',
})
export class SidePanelHeaderDirective {
  @HostBinding('class') headerClass = 'cd-panel-header';
}

/**
 * Panel Footer used as a selector
 */

@Directive({
  selector: '[cdPanelFooter]',
})
export class SidePanelFooterDirective {
  @HostBinding('class') footerClass = 'cd-panel-footer';
}

const DEFAULT_SIZE = 200;
const DEFAULT_MIN_SIZE = 150;
const DEFAULT_MAX_SIZE = 640;

@Component({
  selector: 'cd-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidePanelComponent implements OnInit, OnDestroy, AfterViewInit {
  private _subscription = Subscription.EMPTY;
  private _destroyed = new ReplaySubject<void>(1);
  private _offsetStart = 0;
  private _dragging = false;
  private _size = DEFAULT_SIZE;
  private _visible = true;
  private _animating = false;
  private _initialized = false;
  private _hideBorder = false;

  @Input() templateRef?: TemplateRef<any>;
  @Input() min = DEFAULT_MIN_SIZE;
  @Input() max = DEFAULT_MAX_SIZE;
  @Input() position: Position = Position.Left;

  @Input()
  set visible(value) {
    if (value !== this._visible) {
      this._visible = value;
      if (this._initialized === true) {
        this.attachTransitionListener();
        this.updatePosition();
      }
    }
  }
  get visible() {
    return this._visible;
  }

  get minWidth() {
    return this._size;
  }

  @Input()
  @HostBinding('class.hide-border')
  public set hideBorder(value) {
    this._hideBorder = coerceBooleanProperty(value);
  }
  public get hideBorder() {
    return this._hideBorder;
  }

  @Input()
  @HostBinding('style.right.px')
  public right?: number;

  @Input()
  @HostBinding('style.bottom.px')
  public bottom?: number;

  @Input()
  @HostBinding('style.top.px')
  public top?: number;

  @Input()
  @HostBinding('style.left.px')
  public left?: number;

  @HostBinding('style.width.px')
  public width?: number | string;

  @HostBinding('style.height.px')
  public height?: number | string;

  @HostBinding('class.show-edge-on-close')
  public showOnClose = false;

  @Output() readonly sizeChange = new EventEmitter<number>();

  @Input()
  set showEdgeOnClose(value: boolean) {
    this.showOnClose = coerceBooleanProperty(value);
  }

  @Input()
  set size(value) {
    if (value === undefined) return;
    const { min, max } = this;
    this._size = clamp(value, min, max);
    this.updatePosition();
  }

  get size(): number {
    return this._size;
  }

  @HostBinding('class.dragging')
  get getDragging(): boolean {
    return this._dragging;
  }

  @HostBinding('class.left')
  get getLeft(): boolean {
    return this.position === Position.Left;
  }

  @HostBinding('class.right')
  get getRight(): boolean {
    return this.position === Position.Right;
  }

  @HostBinding('class.top')
  get getTop(): boolean {
    return this.position === Position.Top;
  }

  @HostBinding('class.bottom')
  get getBottom(): boolean {
    return this.position === Position.Bottom;
  }

  @HostBinding('class.hidden')
  get getHidden(): boolean {
    return !this.visible;
  }

  get active(): boolean {
    const { _initialized, _visible, _animating } = this;
    return _initialized && (_visible || _animating);
  }

  attachTransitionListener() {
    this._animating = true;
    fromEvent<TransitionEvent>(this.element, 'transitionend')
      .pipe(
        filter((e) => e.target === e.currentTarget),
        take(1),
        takeUntil(this._destroyed)
      )
      .subscribe(this.onTransitionEnd);
  }

  onTransitionEnd = () => {
    this._animating = false;
    this._cdRef.markForCheck();
  };

  constructor(private _cdRef: ChangeDetectorRef, private _elemRef: ElementRef) {}

  get element() {
    return this._elemRef.nativeElement;
  }

  ngAfterViewInit(): void {
    this._initialized = true;
    this._cdRef.markForCheck();
  }

  updatePosition(): void {
    const { _size, isHorizontal, visible } = this;
    const value = visible ? _size : 0;
    this.height = isHorizontal ? AUTO_VALUE : value;
    this.width = isHorizontal ? value : AUTO_VALUE;
  }

  ngOnInit(): void {
    this.updatePosition();
  }

  get isHorizontal(): boolean {
    const { position } = this;
    return position === Position.Left || position === Position.Right;
  }

  get isTopOrLeft(): boolean {
    const { position } = this;
    return position === Position.Top || position === Position.Left;
  }

  /** Select the correct cursor depending on direction */

  get cursor(): CursorStateType {
    return this.isHorizontal ? CursorState.ColResize : CursorState.RowResize;
  }

  /** Sets the cursor style while dragging to the body */
  set resizing(showCursor: boolean) {
    if (showCursor) {
      const { cursor } = this;
      assignGlobalCursor(cursor);
    } else {
      assignGlobalCursor();
    }
  }

  private _handleDrag = (e: MouseEvent): void => {
    const { clientX, clientY } = e;
    const { _offsetStart } = this;
    const value = this.getPosition(clientX, clientY, _offsetStart);
    this.size = value;
    this._cdRef.markForCheck();
  };

  private _removeListeners = (): void => {
    this.resizing = false;
    this._subscription.unsubscribe();
  };

  getPosition(clientX: number, clientY: number, value: number) {
    const { isHorizontal, isTopOrLeft } = this;
    const pos = isHorizontal ? clientX : clientY;
    const dir = isTopOrLeft ? 1 : -1;
    return pos * dir - value;
  }

  _onDragEnd = (e: PointerEvent): void => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    this._dragging = false;
    this.sizeChange.emit(this.size);
    this._removeListeners();
  };

  onDragStart(e: PointerEvent): void {
    const { clientX, clientY, pointerId, currentTarget } = e;
    const element = currentTarget as HTMLElement;
    element.setPointerCapture(pointerId);
    this.resizing = true;
    this._dragging = true;
    this._offsetStart = this.getPosition(clientX, clientY, this.size);
    this._subscription = new Subscription();
    this._subscription.add(
      merge(
        fromEvent<PointerEvent>(element, 'pointerup'),
        fromEvent<PointerEvent>(element, 'pointerleave')
      ).subscribe(this._onDragEnd)
    );

    const move$ = fromEvent<PointerEvent>(element, 'pointermove');
    this._subscription.add(move$.subscribe(this._handleDrag));

    this._handleDrag(e);
  }

  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
    this._removeListeners();
  }
}
