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
  HostListener,
  AfterViewInit,
  ChangeDetectionStrategy,
  HostBinding,
  OnDestroy,
  Input,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { Store, select } from '@ngrx/store';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { auditTime, debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { ILockingRect, ICanvas, IScrollbar, ICanvasPosition, IUserCursor } from 'cd-interfaces';
import { matrix2d, translate } from 'cd-utils/css';
import { IPanelsState } from '../../interfaces/panel.interface';
import { MarqueeService } from '../../services/marquee/marquee.service';
import { KeyboardService } from '../../services/keyboard/keyboard.service';
import { CanvasService } from '../../services/canvas/canvas.service';
import { InteractionService } from '../../services/interaction/interaction.service';
import { generateBounds, calculateScrollbars } from '../../utils/canvas.utils';
import { ViewportService } from '../../services/viewport/viewport.service';
import { PropertiesService } from '../../services/properties/properties.service';
import { deselectActiveElement } from 'cd-utils/selection';
import * as projectStoreModule from '../../store';
import { areObjectsEqual } from 'cd-utils/object';
import { IPoint, createPoint } from 'cd-utils/geometry';
import { KEYS, MouseButton } from 'cd-utils/keycodes';
import { toPercent } from 'cd-utils/numeric';
import { BODY_TAG } from 'cd-common/consts';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { RtcService } from 'src/app/services/rtc/rtc.service';
import { PresenceService } from 'src/app/services/presence/presence.service';

const SCROLL_TIMEOUT = 1000;
const MOUSE_MOVE_BUFFER_TIME = 50;
const A_KEY = 'a';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  private _dragStart: IPoint = createPoint();
  private _dragging = false;
  private _marqueeActive = false;
  private _subscriptions = new Subscription();
  private _cursorSubscription = new Subscription();
  private _currentPanelState?: IPanelsState;
  private _canvas!: ICanvas;
  private _cursorUpdates$ = new Subject<IUserCursor | null>();

  public position?: string;
  public scrollPosY?: string;
  public scrollPosX?: string;
  public scrollbars?: IScrollbar;
  public fontSize = 100;
  public borderSize = 1;

  @Input() isRecording = false;
  @Input() breakGlass = false;

  get canvas(): ICanvas {
    return this._canvas;
  }
  @Input() set canvas(value: ICanvas) {
    const positionDidChange = this.positionChanged(value.position);
    this._canvas = value;
    if (!positionDidChange) return;
    this.updateCanvasPosition(value.position);
  }

  @HostBinding('class.scrolling') showScrollbars = false;
  @HostBinding('class.grabbing') grabbing = false;
  @HostBinding('class.grab') grab = false;

  constructor(
    private _canvasService: CanvasService,
    private _cdRef: ChangeDetectorRef,
    private _elemRef: ElementRef,
    private _marqueeSerivce: MarqueeService,
    private _interactionService: InteractionService,
    private _keyboardService: KeyboardService,
    private _viewportService: ViewportService,
    private _projectStore: Store<projectStoreModule.IProjectState>,
    private _propsService: PropertiesService,
    private _projectContentService: ProjectContentService,
    private _rtcService: RtcService,
    private _presenceService: PresenceService
  ) {}

  ngOnDestroy(): void {
    this.clearDragEvents();
    this._marqueeSerivce.resetMode();
    this._subscriptions.unsubscribe();
    this.broadcastCursorUpdate(null);
  }

  positionChanged(position: ICanvasPosition): boolean {
    const canvasPosition = this._canvas && this._canvas.position;
    if (!canvasPosition) return true;
    if (canvasPosition.x !== position.x) return true;
    if (canvasPosition.y !== position.y) return true;
    if (canvasPosition.z !== position.z) return true;
    return false;
  }

  updateCanvasPosition(position: ICanvasPosition) {
    const { x, y, z } = position;
    const scale = 1 / z;
    this.borderSize = scale;
    this.fontSize = toPercent(scale);
    this.position = matrix2d(x, y, z);
    this.updateScrollbars(this._canvas);
  }

  updateScrollbars(canvas: ICanvas) {
    const scrollbars = calculateScrollbars(canvas);
    const { vertPos, vertX, horzPos, vertY } = scrollbars;
    this.scrollbars = scrollbars;
    this.scrollPosY = translate(vertX, vertPos);
    this.scrollPosX = translate(horzPos, vertY);
  }

  onPanelStateSubscription = (state: IPanelsState) => {
    const xp = { leftPanel: state.leftPanel, rightPanel: state.rightPanel };
    const currentLeft = this._currentPanelState?.leftPanel;
    const currentRight = this._currentPanelState?.rightPanel;
    const yp = { leftPanel: currentLeft, rightPanel: currentRight };
    const samePanelSize = areObjectsEqual(xp, yp);
    this._currentPanelState = state;
    if (samePanelSize) return; // Only update if Left or Right panel size changes
    this.updateViewport();
  };

  onOutletFramesSubscription = (frames: ILockingRect[]) => {
    const bounds = generateBounds(frames);
    if (frames.length === 0) {
      this._canvasService.reset(bounds);
    } else {
      this._canvasService.updateCanvas({ bounds });
    }
  };

  get element() {
    return this._elemRef.nativeElement;
  }

  initStateListeners(): void {
    const wheelEvent$ = fromEvent<WheelEvent>(this.element, 'wheel', { passive: true });
    const windowKeydown$ = fromEvent<KeyboardEvent>(window, 'keydown').pipe(
      // This prevents the code below from getting called
      // when a user is interacting with an input field for example
      filter((e) => (e.target as HTMLElement).tagName === BODY_TAG)
    );
    const outletFrames$ = this._propsService.currentOutletFrames$.pipe(
      map((outletFrames) => outletFrames.map((outlet) => outlet.frame)),
      distinctUntilChanged((x, y) => areObjectsEqual(x, y))
    );

    const _panelState$ = this._projectStore.pipe(select(projectStoreModule.getPanelsState));
    const _scroll$ = this._canvasService.isMoving$.pipe(
      tap(this.tapCanvasMove),
      debounceTime(SCROLL_TIMEOUT)
    );

    const mousemoveAudit$ = this._cursorUpdates$.pipe(auditTime(MOUSE_MOVE_BUFFER_TIME));

    this._subscriptions.add(_panelState$.subscribe(this.onPanelStateSubscription));
    this._subscriptions.add(wheelEvent$.subscribe(this.onWheel));
    this._subscriptions.add(windowKeydown$.subscribe(this.onWindowKeyDown));
    this._subscriptions.add(outletFrames$.subscribe(this.onOutletFramesSubscription));
    this._subscriptions.add(this._viewportService.windowSize$.subscribe(this.updateViewport));
    this._subscriptions.add(_scroll$.subscribe(this.onCanvasMove));
    this._subscriptions.add(mousemoveAudit$.subscribe(this.broadcastCursorUpdate));
  }

  tapCanvasMove = (moving: boolean) => {
    if (moving === true) this.onCanvasMove(true);
  };

  onCanvasMove = (isMoving: boolean) => {
    if (this.showScrollbars === isMoving) return;
    this.showScrollbars = isMoving;
    this._cdRef.markForCheck();
  };

  ngAfterViewInit(): void {
    // wait until properties are loaded before performing other calculations
    this._subscriptions.add(
      this._projectContentService.projectLoaded$.subscribe(
        (loaded) => loaded && this.initStateListeners()
      )
    );
    this._subscriptions.add(this._keyboardService.spaceBarDown$.subscribe(this.onSpacebar));
  }

  onSpacebar = (pressed: boolean) => {
    this.grab = pressed;
    this._cdRef.markForCheck();
  };

  get inSymbolIsolationMode(): boolean {
    return Boolean(this._currentPanelState?.symbolMode);
  }

  private updateViewport = () => {
    if (!this._currentPanelState) return;
    this._canvasService.updateViewport(this._currentPanelState);
  };

  onWheel = (e: WheelEvent) => {
    // e.preventDefault();
    const { deltaX, deltaY, ctrlKey, metaKey, clientX, clientY, pageX, pageY } = e;
    const zoomKey = ctrlKey || metaKey;
    /** Pinch and Zoom on macOS or holding the CTRL key */
    if (zoomKey === true) {
      this._canvasService.zoom(clientX, clientY, deltaY);
    } else {
      this._canvasService.pan(deltaX, deltaY);
    }
    this.calcCursorUpdate(pageX, pageY);
  };

  isTargetCanvas(e: MouseEvent): boolean {
    const elem = e.target as HTMLElement;
    const current = e.currentTarget as HTMLElement;
    return current.tagName === elem.tagName;
  }

  @HostListener('click', ['$event'])
  onClick(e: MouseEvent) {
    const { clientX, clientY } = e;
    const { x, y } = this._dragStart;
    const deltaX = clientX - x;
    const deltaY = clientY - y;
    const noMovement = deltaX + deltaY === 0;
    const canvasClicked = this.isTargetCanvas(e);
    if (!this.grab && canvasClicked && noMovement) {
      this._interactionService.deselectAll();
    }
  }

  setStartDrag(e: MouseEvent) {
    const { canvas } = this;
    if (!canvas) return;
    const { screenY, screenX } = e;
    const { position } = canvas;
    const { x, y } = position;
    const dx = x - screenX;
    const dy = y - screenY;
    this._dragStart = createPoint(dx, dy);
  }

  startDrag(e: MouseEvent) {
    this.setStartDrag(e);
    this._dragging = true;
    this.grabbing = true;
    this.addCusorEvents(this.onGrabMove);
  }

  addCusorEvents(actionFn: (e: MouseEvent) => void) {
    this._cursorSubscription = new Subscription();
    const mousemove$ = fromEvent<MouseEvent>(window, 'mousemove');
    const mouseup$ = fromEvent<MouseEvent>(window, 'mouseup');
    this._cursorSubscription.add(mousemove$.subscribe(actionFn));
    this._cursorSubscription.add(mouseup$.subscribe(this.onMouseUp));
  }

  startMarqueeSelect(e: MouseEvent) {
    const { canvas } = this;
    if (!canvas) return;
    const { clientX, clientY } = e;
    this._dragging = true;
    this._marqueeActive = true;
    this._dragStart = { x: clientX, y: clientY };
    this._marqueeSerivce.updateMarqueeSelection(clientX, clientY);
    this.addCusorEvents(this.onMarquee);
  }

  @HostListener('mousedown', ['$event'])
  onMouseEvent(e: MouseEvent) {
    // Ignore right click and dragging
    if (e.button === MouseButton.Left && this._dragging === false) {
      e.preventDefault();
      deselectActiveElement();
      if (this.grab && !this.grabbing) {
        this.startDrag(e);
      } else if (this.isTargetCanvas(e)) {
        this.startMarqueeSelect(e);
      }
    }
  }

  get canvasPosition(): ICanvasPosition | undefined {
    return this.canvas?.position;
  }

  onMarquee = (e: MouseEvent) => {
    const { _dragStart, canvasPosition } = this;
    if (!canvasPosition) return;
    const { clientX, clientY } = e;
    const { x, y } = _dragStart;
    const width = clientX - _dragStart.x;
    const height = clientY - _dragStart.y;
    this._marqueeSerivce.updateMarqueeSelection(x, y, width, height, canvasPosition);
  };

  get isGrabbing() {
    return this.grab && this.grabbing;
  }

  onGrabMove = (e: MouseEvent) => {
    if (this.isGrabbing) {
      e.preventDefault();
      e.stopPropagation();
      const { _dragStart } = this;
      const { screenX, screenY } = e;
      const { x, y } = _dragStart;
      const xp = x + screenX;
      const yp = y + screenY;
      this._canvasService.drag(xp, yp);
    }
  };

  onMouseUp = () => {
    this.grabbing = false;
    this._marqueeActive = false;
    this.clearDragEvents();
    this._marqueeSerivce.finishMarqueeSelection(this.canvasPosition);
  };

  clearDragEvents() {
    this._dragging = false;
    this._cursorSubscription.unsubscribe();
  }

  handleAKey = (e: KeyboardEvent) => {
    // Prevent select all
    if (e.metaKey) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }

    if (!this.inSymbolIsolationMode) {
      this._marqueeSerivce.toggleBoardCreationMode();
    }
  };

  handleEscKey = () => {
    if (!this._marqueeSerivce.isCreateBoardMode) return;
    this._marqueeSerivce.deactivateBoardCreateMode();
  };

  onWindowKeyDown = (e: KeyboardEvent) => {
    if (e.key === A_KEY) this.handleAKey(e);
    if (e.key === KEYS.Escape) this.handleEscKey();
  };
  /**
   * IMPORTANT
   * Prevents the canvas from scrolling when an outlet frame gets focused
   */
  @HostListener('scroll', ['$event'])
  onScroll(e: Event) {
    const element = e.target as HTMLElement;
    e.preventDefault();
    element.scrollLeft = 0;
    element.scrollTop = 0;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.calcCursorUpdate(e.pageX, e.pageY);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this._cursorUpdates$.next(null);
  }

  private calcCursorUpdate(x: number, y: number) {
    const { canvas } = this._canvasService;
    const { sessionId } = this._presenceService;
    const isolatedSymbolId = this._currentPanelState?.isolatedSymbolId;
    const cursor: IUserCursor = { x, y, canvas, sessionId, isolatedSymbolId };
    const { marqueeRect } = this._marqueeSerivce;
    if (this._marqueeActive) cursor.marqueeRect = marqueeRect;
    this._cursorUpdates$.next(cursor);
  }

  private broadcastCursorUpdate = (cursor: IUserCursor | null) => {
    if (cursor) this._rtcService.broadcastCursorPositionMessage(cursor);
    else this._rtcService.broadcastHideCursorMessage();
  };
}
