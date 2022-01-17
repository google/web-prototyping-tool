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
  Input,
  HostBinding,
  OnDestroy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { ICanvas } from '../../interfaces/canvas.interface';
import { InteractionService } from '../../services/interaction/interaction.service';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { SelectionContextService } from '../../services/selection-context/selection.context.service';
import { SelectTargetService } from '../../services/select-target/select-target.service';
import { MarqueeMode, MarqueeService } from '../../services/marquee/marquee.service';
import { IAppState, getUserSettings } from 'src/app/store';
import { KeyboardService } from '../../services/keyboard/keyboard.service';
import { DndDirectorService } from '../../dnd-director/dnd-director.service';
import { Store, select } from '@ngrx/store';
import * as cd from 'cd-interfaces';
import * as utils from './glass.utils';

@Component({
  selector: 'app-glass-layer',
  templateUrl: './glass-layer.component.html',
  styleUrls: ['./glass-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlassLayerComponent implements OnDestroy, OnInit {
  private _disableContextualOverlay = false;
  private _canvas?: ICanvas;
  private _outletFrameOrder: ReadonlyArray<string> = [];
  private _selectTargetActive = false;
  private _showLabel = false;
  private _subs = new Subscription();
  private _metaKeyDown = false;

  public outletFrameScrollRect: ReadonlyMap<string, cd.IRect> = new Map();
  public elements: cd.RenderElementMap = new Map();
  public highlight: cd.RenderElementMap = new Map();
  public renderRects: cd.RenderRectMap = new Map();
  public selectedProperties: cd.ReadOnlyPropertyModelList = [];
  public selectionState: cd.RenderElementMap = new Map();
  public outletFrames: ReadonlyArray<cd.IRenderResult> = [];
  public marqueeRect?: cd.IRect;

  public boardMoving = false;
  public breakGlass = false;
  public canvasMoving = false;
  public debugCanvas = false;
  public debugGlass = false;
  public dragging = false;
  public hideGlass = false;
  public interacting = false;
  public showMarquee = false;
  public selectionSize = 0;
  public createBoard = false;
  public zoom = 1;

  @Input() canvasPos?: string;
  @Input() isRecording = false;

  @HostBinding('class.grab')
  @Input()
  grab = false;

  @Input()
  set canvas(value: ICanvas | undefined) {
    this._canvas = value;
    this.zoom = value?.position.z ?? 1;
  }
  get canvas(): ICanvas | undefined {
    return this._canvas;
  }

  constructor(
    private readonly _appStore: Store<IAppState>,
    private _selectionCtxService: SelectionContextService,
    private _selectTarget: SelectTargetService,
    private _interactService: InteractionService,
    private _marqueeService: MarqueeService,
    private _dndService: DndDirectorService,
    private _cdRef: ChangeDetectorRef,
    public keyboardService: KeyboardService
  ) {}

  get moving() {
    return this.interacting || this.dragging || this.boardMoving;
  }

  get isOneElementSelected() {
    return this.selectionSize === 1;
  }

  get canShowResizeHandles() {
    return (
      this.dragging === false &&
      this.isOneElementSelected === true &&
      this.boardMoving === false &&
      this._selectTargetActive === false
    );
  }

  get canShowStyleVisLayer() {
    return this.dragging === false && this.isOneElementSelected && this.showMarquee === false;
  }

  get showContextOverlay() {
    return (
      this.breakGlass === false &&
      this.isRecording === false &&
      this._canvas !== undefined &&
      this._disableContextualOverlay === false &&
      this._selectTargetActive === false
    );
  }

  get canSelectAnyElement() {
    return this._metaKeyDown === true || this._selectTargetActive === true;
  }

  get showLabel() {
    return this._showLabel || this._selectTargetActive === true;
  }

  ngOnInit(): void {
    const outletRects$ = this._interactService.outletFrameRects$.pipe(
      map((items) => Array.from(items.values()))
    );

    const userSettings$ = this._appStore.pipe(
      select(getUserSettings),
      distinctUntilChanged(utils.filterUserDebugSettings)
    );

    const move$ = this._interactService.boardMoving$.pipe(distinctUntilChanged());

    this._subs.add(outletRects$.subscribe(this.onOutletFrameRects));
    this._subs.add(userSettings$.subscribe(this.onUserSettings));
    this._subs.add(move$.subscribe(this.onBoardMove));
    this._subs.add(this.keyboardService.metaKeyDown$.subscribe(this.onMetaKeydown));
    this._subs.add(this.keyboardService.altKeyDown$.subscribe(this.onAltKeydown));
    this._subs.add(this._selectTarget.active$.subscribe(this.onSelectTargetActive));
    this._subs.add(this._selectionCtxService.selectedProperties.subscribe(this.onSelectedProps));
    this._subs.add(this._dndService.dragActive$.subscribe(this.onActiveDrag));
    this._subs.add(this._interactService.renderRects$.subscribe(this.onRenderRects));
    this._subs.add(this._interactService.outletFrameOrder$.subscribe(this.onOutletFrameOrder));
    this._subs.add(this._interactService.highlight$.subscribe(this.onHighlight));
    this._subs.add(this._interactService.interacting$.subscribe(this.onInteracting));
    this._subs.add(this._interactService.selection$.subscribe(this.onSelection));
    this._subs.add(this._marqueeService.marqueeRect$.subscribe(this.onMarquee));
    this._subs.add(this._marqueeService.mode$.subscribe(this.onMarqueeMode));
    this._subs.add(this._interactService.propsInteracting$.subscribe(this.onPropsInteraction));
  }

  onUserSettings = (userSettings: cd.IUserSettings) => {
    const { debugGlass, breakGlass, debugCanvas, disableContextualOverlay } = userSettings;
    this._disableContextualOverlay = disableContextualOverlay;
    this.debugCanvas = debugCanvas;
    this.debugGlass = debugGlass;
    this.breakGlass = breakGlass;
    this._cdRef.markForCheck();
  };

  onAltKeydown = (down: boolean) => {
    this._showLabel = down;
    this._cdRef.markForCheck();
  };

  onMetaKeydown = (down: boolean) => {
    this._metaKeyDown = down;
    this._cdRef.markForCheck();
  };

  onSelectTargetActive = (active: boolean) => {
    this._selectTargetActive = active;
    this._cdRef.markForCheck();
  };

  onPropsInteraction = (propsUpdate: boolean) => {
    this.hideGlass = propsUpdate;
    this._cdRef.markForCheck();
  };

  onBoardMove = (moving: boolean) => {
    this.boardMoving = moving;
    this._cdRef.markForCheck();
  };

  onSelectedProps = (props: cd.PropertyModel[]) => {
    this.selectedProperties = props;
    this._cdRef.markForCheck();
  };

  onActiveDrag = (dragging: boolean) => {
    if (this.dragging === dragging) return;
    this.dragging = dragging;
    this._cdRef.markForCheck();
  };

  onInteracting = (interacting: boolean) => {
    this.interacting = interacting;
    this._cdRef.markForCheck();
  };

  onMarqueeMode = (mode: MarqueeMode) => {
    this.createBoard = mode === MarqueeMode.CreateBoard;
    this._cdRef.markForCheck();
  };

  onMarquee = (rect: cd.IRect) => {
    const everyRectValueIsValid = !Object.values(rect).every((item) => !!!item);
    this.marqueeRect = rect;
    this.showMarquee = everyRectValueIsValid;
    this._cdRef.markForCheck();
  };

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  onSelection = (selection: cd.RenderElementMap) => {
    this.selectionState = selection;
    this.selectionSize = utils.sizeFromSelection(selection);
    this._cdRef.markForCheck();
  };

  onHighlight = (highlight: cd.RenderElementMap) => {
    this.highlight = highlight;
    this._cdRef.markForCheck();
  };

  onOutletFrameOrder = (outletFrameOrder: ReadonlyArray<string>) => {
    this._outletFrameOrder = outletFrameOrder;
    this.sortFrames();
    this._cdRef.markForCheck();
  };

  sortFrames() {
    const { _outletFrameOrder, outletFrames } = this;
    this.outletFrames = utils.sortOutletFrames(outletFrames, _outletFrameOrder);
  }

  onOutletFrameRects = (outletFrameRects: cd.IRenderResult[]) => {
    this.outletFrames = outletFrameRects;
    this.sortFrames();
    this._cdRef.markForCheck();
  };

  onRenderRects = (renderRects: cd.RenderRectMap) => {
    const elements = this._interactService.elementsByOutletFrame$.getValue();
    this.outletFrameScrollRect = utils.scrollRectFromElementRects(elements, renderRects);
    this.elements = elements;
    this.renderRects = renderRects;
    this._cdRef.markForCheck();
  };

  trackFn(_index: number, item: cd.RootElement): string {
    return item.id;
  }
}
