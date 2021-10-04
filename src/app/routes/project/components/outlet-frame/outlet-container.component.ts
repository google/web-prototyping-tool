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
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnDestroy,
  HostBinding,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { InteractionService } from '../../services/interaction/interaction.service';
import { ISelectionState } from '../../store/reducers/selection.reducer';
import { AppGoToPreview } from 'src/app/store/actions/router.action';
import { RenderOutletIFrameComponent } from 'src/app/components/render-outlet-iframe/render-outlet-iframe.component';
import { OutletLabelComponent } from './outlet-label.component';
import { ElementPropertiesUpdate, IProjectState } from '../../store';
import { CanvasService } from '../../services/canvas/canvas.service';
import { getShowingBoardIds, IAppState } from 'src/app/store';
import { debounceTime, switchMap } from 'rxjs/operators';
import { buildBoard, IBoard } from './outlet.utils';
import { approxDist, createPoint, IPoint } from 'cd-utils/geometry';
import { areObjectsEqual } from 'cd-utils/object';
import { select, Store } from '@ngrx/store';
import { EMPTY, Subscription } from 'rxjs';
import * as cd from 'cd-interfaces';
import { half } from 'cd-utils/numeric';
import { PropertiesService } from '../../services/properties/properties.service';

@Component({
  selector: 'app-outlet-container',
  templateUrl: './outlet-container.component.html',
  styleUrls: ['./outlet-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutletContainerComponent implements OnInit, OnDestroy {
  private _rectMap: cd.RenderRectMap = new Map();
  private _outletOrder: ReadonlyArray<string> = [];
  private _subscription = new Subscription();
  private _zoomLevel = 1;

  public outletFrames: ReadonlyArray<cd.RootElement> = [];
  public boards: ReadonlyArray<IBoard> = [];
  public showBoardIds = false;
  public iconScale = 1;
  public visibleBoards: ReadonlyArray<string> = [];

  @Input() commentCount = new Map<string, number>();
  @Input() homeboardId?: string;
  @Input() selection?: ISelectionState;
  @Input()
  set zoomLevel(zoom: number) {
    this.iconScale = 1 / zoom;
    this._zoomLevel = zoom;
  }
  get zoomLevel() {
    return this._zoomLevel;
  }

  @Input()
  @HostBinding('class.break-glass')
  breakGlass = false;

  @ViewChildren('boardRef') boardsRef?: QueryList<RenderOutletIFrameComponent>;
  @ViewChildren('labelRef') labelsRef?: QueryList<OutletLabelComponent>;

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _interactionService: InteractionService,
    private _canvasService: CanvasService,
    private _propsService: PropertiesService,
    private readonly _appStore: Store<IAppState>,
    private readonly _projectStore: Store<IProjectState>
  ) {}

  ngOnInit(): void {
    const showBoardIds$ = this._appStore.pipe(select(getShowingBoardIds));
    const outletFrames$ = this._propsService.currentOutletFrames$;
    const { outletFrameRects$, outletFrameOrder$, visibleBoards$ } = this._interactionService;
    this._subscription.add(showBoardIds$.subscribe(this.onShowBoardIds));
    this._subscription.add(outletFrames$.subscribe(this.onOutletFrames));
    this._subscription.add(outletFrameRects$.subscribe(this.onFrameUpdate));
    this._subscription.add(outletFrameOrder$.subscribe(this.onOutletFrameOrder));
    const update$ = this._canvasService.isMoving$.pipe(
      // Wait until the canvas has stopped moving to load in visible boards
      switchMap((value) => (value === false ? visibleBoards$.pipe(debounceTime(200)) : EMPTY))
    );
    this._subscription.add(update$.subscribe(this.onVisibleBoards));
  }

  get boardRefs() {
    return this.boardsRef?.toArray() || [];
  }

  get labelRefs() {
    return this.labelsRef?.toArray() || [];
  }

  get canvasCenterPoint(): [IPoint, IPoint] {
    const { canvas } = this._canvasService;
    const { z, y: cy, x: cx } = canvas.position;
    const [viewportX, viewportY] = canvas.offset;
    const { viewPortWidth, viewPortHeight } = canvas;
    const x = (viewportX + half(viewPortWidth)) / z;
    const y = (viewportY + half(viewPortHeight)) / z;
    return [createPoint(x, y), createPoint(cx / z, cy / z)];
  }

  getCenterPoint(frame: cd.IRect | undefined, canvasOffset: IPoint): IPoint {
    const x = frame ? frame.x + half(frame.width) : 0;
    const y = frame ? frame.y + half(frame.height) : 0;
    const ox = x + canvasOffset.x;
    const oy = y + canvasOffset.y;
    return createPoint(ox, oy);
  }

  calcOutletDist(
    outlet: RenderOutletIFrameComponent,
    centerPt: IPoint,
    canvasOffset: IPoint,
    cache: Map<string, number>
  ): number {
    const pt = this.getCenterPoint(outlet.frame, canvasOffset);
    const dist = approxDist(centerPt, pt);
    cache.set(outlet.id, dist);
    return dist;
  }

  onVisibleBoards = (visibleBoards: ReadonlyArray<string>) => {
    this.visibleBoards = visibleBoards;
    const [centerPt, offsetPt] = this.canvasCenterPoint;
    const cache = new Map<string, number>();
    const boards = this.boardRefs.sort((a, b) => {
      const aDist = cache.get(a.id) ?? this.calcOutletDist(a, centerPt, offsetPt, cache);
      const bDist = cache.get(b.id) ?? this.calcOutletDist(b, centerPt, offsetPt, cache);
      return aDist - bDist;
    });

    for (const board of boards) {
      board.isVisible = visibleBoards.includes(board.id);
    }

    this._cdRef.markForCheck();
  };

  onOutletFrames = (frames: cd.RootElement[]) => {
    this.outletFrames = frames;
    this.processFrames();
  };

  onFrameUpdate = (rects: cd.RenderRectMap) => {
    this._rectMap = rects;
    this.processFrames();
  };

  onOutletFrameOrder = (order: ReadonlyArray<string>) => {
    this._outletOrder = order;
    this.processFrames();
  };

  onShowBoardIds = (show: boolean) => {
    this.showBoardIds = show;
    this.processFrames();
  };

  processFrames = () => {
    const { _rectMap, outletFrames, _outletOrder } = this;
    const boards = buildBoard(_rectMap, outletFrames, _outletOrder);
    if (areObjectsEqual(boards, this.boards)) return;
    this.boards = boards;
    this._cdRef.markForCheck();
  };

  trackByFn(_index: number, item: IBoard) {
    return item.id;
  }

  onOpenPreview(outletId?: string, showComments = true) {
    this._appStore.dispatch(new AppGoToPreview(outletId, showComments));
  }

  onOutletFrameNameChanged(name: string, { id: elementId }: IBoard) {
    const payload = [{ elementId, properties: { name } }];
    const action = new ElementPropertiesUpdate(payload);
    this._projectStore.dispatch(action);
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
