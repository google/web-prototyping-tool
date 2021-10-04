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

/* eslint-disable max-lines */
import { ElementPropertiesUpdate } from '../../store/actions/element-properties.action';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { buildPropertyUpdatePayload, rectsIntersect } from 'cd-common/utils';
import { ISelectionState } from '../../store/reducers/selection.reducer';
import { IConfigPayload } from '../../interfaces/action.interface';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Injectable, OnDestroy } from '@angular/core';
import { IProjectState } from '../../store/reducers';
import { areObjectsEqual } from 'cd-utils/object';
import { getRootIds } from 'cd-common/models';
import { Store, select } from '@ngrx/store';
import { CanvasService } from '../canvas/canvas.service';
import { areArraysEqual } from 'cd-utils/array';
import * as selectors from '../../store/selectors';
import * as actions from '../../store/actions';
import * as utils from './interaction.utils';
import * as snapUtils from './snap.utils';
import * as cd from 'cd-interfaces';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { PropertiesService } from '../properties/properties.service';

@Injectable({ providedIn: 'root' })
export class InteractionService implements OnDestroy {
  private _elementProperties: cd.ElementPropertiesMap = {};
  private _snappedPos = new snapUtils.SnapPosition();
  private _selectionState?: ISelectionState;
  private _subscriptions = new Subscription();
  private _outletFrames: ReadonlyArray<utils.RootFrame> = [];
  public visibleBoards$ = new BehaviorSubject<ReadonlyArray<string>>([]);
  public outletFrameOrder$ = new BehaviorSubject<ReadonlyArray<string>>([]);
  public outletFrameRects$ = new BehaviorSubject<cd.RenderRectMap>(new Map());
  public elementProperties$: Observable<cd.ElementPropertiesMap>;
  public elementsByOutletFrame$ = new BehaviorSubject<cd.RenderElementMap>(new Map());
  public highlight$ = new BehaviorSubject<cd.RenderElementMap>(new Map());
  public interacting$ = new BehaviorSubject<boolean>(false);
  public propsPanelInteraction = new utils.InteractionQueue();
  // public marqueeRect$ = new BehaviorSubject<cd.IRect>(generateFrame());
  public renderRects$ = new BehaviorSubject<cd.RenderRectMap>(new Map());
  public selection$ = new BehaviorSubject<cd.RenderElementMap>(new Map());
  public linePoints$ = new BehaviorSubject<cd.ILine[]>([]);
  public boardMoving$ = new BehaviorSubject<boolean>(false);
  public selectionState$?: Observable<ISelectionState>;

  constructor(
    private _rendererService: RendererService,
    private _canvasService: CanvasService,
    private _projectStore: Store<IProjectState>,
    private _projectContentService: ProjectContentService,
    private _propsService: PropertiesService
  ) {
    const outletFrames$ = this._propsService.currentOutletFrames$.pipe(
      map((item) => item.map(({ id, elementType, frame }) => ({ id, elementType, frame }))),
      distinctUntilChanged((x, y) => areObjectsEqual(x, y))
    );

    this.selectionState$ = this._projectStore.pipe(select(selectors.getSelectionState));
    this.elementProperties$ = this._projectContentService.elementProperties$;
    this._subscriptions.add(outletFrames$.subscribe(this.onOutletFramesSubscription));
    this._subscriptions.add(this.elementProperties$.subscribe(this.onElementProperties));
    this._subscriptions.add(this.selectionState$.subscribe(this.onSelectionChange));
    this._subscriptions.add(
      this._rendererService.renderResultsByBoard$.subscribe(this.onRenderResults)
    );

    this._subscriptions.add(
      this._canvasService.canvas$
        .pipe(
          map((canvas) => utils.filterBoardsVisibleInViewport(canvas, this._outletFrames)),
          distinctUntilChanged(areArraysEqual)
        )
        .subscribe(this.onVisibleBoards)
    );
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  private onVisibleBoards = (boards: ReadonlyArray<string>) => {
    this.visibleBoards$.next(boards);
  };

  private updateFrameOrder(outletFrames: utils.RootFrame[]) {
    const outletIds = outletFrames.map((item) => item.id);
    // Removes outletFrameIds from order which have been removed from IOutletFrameProperties[]
    const order = [...this.outletFrameOrder$.getValue()].filter((id) => outletIds.includes(id));
    // Add new outletFrames to the top of the stack
    for (const outletId of outletIds) {
      if (!order.includes(outletId)) order.push(outletId);
    }

    this.outletFrameOrder = order;
  }

  propsPanelInteracting() {
    this.propsPanelInteraction.didInteract();
  }

  get propsInteracting$(): BehaviorSubject<boolean> {
    return this.propsPanelInteraction.interacting$;
  }

  get renderRects() {
    return this.renderRects$.getValue();
  }

  get mergedRenderRects(): cd.RenderRectMap {
    const { renderRects, outletFrameRects } = this;
    return new Map([...renderRects, ...outletFrameRects]);
  }

  set outletFrameOrder(order: ReadonlyArray<string>) {
    const prevOrder = [...this.outletFrameOrder$.getValue()];
    if (!utils.didOrderChange(prevOrder, order)) return;
    this.outletFrameOrder$.next(order);
  }

  private onElementProperties = (props: cd.ElementPropertiesMap) => {
    this._elementProperties = props;
  };

  private onOutletFramesSubscription = (outletFrames: utils.RootFrame[]) => {
    const outletRectMap = new Map();
    for (const outlet of outletFrames) {
      const { id: rootId, frame, elementType: type } = outlet;
      const payload = { frame, rootId, type, id: rootId };
      outletRectMap.set(rootId, payload);
    }
    this.updateFrameOrder(outletFrames);
    this._outletFrames = outletFrames;
    this.outletFrameRects$.next(outletRectMap);
  };

  private onRenderResults = (results: cd.IStringMap<cd.RenderResults>) => {
    const renderRects = new Map();
    const elementsByOutletFrame = new Map();
    const validatedResults = utils.validateRenderResults(results, this._elementProperties);
    for (const [outletFrameId, renderResults] of validatedResults) {
      elementsByOutletFrame.set(outletFrameId, Object.keys(renderResults));
      const children = Object.entries(renderResults);
      for (const [id, renderData] of children) {
        renderRects.set(id, renderData);
      }
    }
    this.elementsByOutletFrame$.next(elementsByOutletFrame);
    this.renderRects$.next(renderRects);
  };

  get interacting(): boolean {
    return this.interacting$.getValue();
  }

  set interacting(value: boolean) {
    if (this.interacting === value) return;
    this.interacting$.next(value);
  }

  highlightElement(id: string) {
    if (!id) this.resetHighlight();
    const element = this._elementProperties[id];
    if (!element) return;
    this.highlight(element.rootId, id);
  }

  highlight(outletFrameId: string, id: string) {
    if (this.interacting === true) return;
    if (!outletFrameId || !id) return;
    const highlight = new Map();
    highlight.set(outletFrameId, [id]);
    this.highlight$.next(highlight);
  }

  isHighlighted(outletFrameId: string, id: string): boolean {
    const highlights = this.highlight$.getValue().get(outletFrameId) || [];
    return highlights.includes(id);
  }

  resetHighlight() {
    this.highlight$.next(new Map());
  }

  removeHighlight(outletFrameId: string, id: string): void {
    if (this.interacting === true) return;
    const highlights = new Map([...this.highlight$.getValue()]);
    const highlighted = highlights.get(outletFrameId) || [];
    const idx = highlighted.indexOf(id);
    if (idx !== -1) {
      this.resetHighlight();
    }
  }

  private onSelectionChange = (state?: ISelectionState) => {
    this._selectionState = state;
    if (!state || state.ids.size === 0) {
      this.selection$.next(new Map());
      return;
    }

    const { _elementProperties } = this;
    const outlets = getRootIds(state.ids, _elementProperties);
    const selection = utils.buildSelectionOutletMap(outlets, state, _elementProperties);
    this.bringSelectedOutletFrameToFront(outlets);
    this.selection$.next(selection);
  };

  /** Used during drag & drop to bring an outletframe forward */
  public bringOutletFrameToFront(outletFrameId: string) {
    const outletFrames = this.outletFrameOrder$.getValue();
    const lastOutletFrameId = outletFrames[outletFrames.length - 1];
    const hasOutletFrame = outletFrames.includes(outletFrameId);
    if (hasOutletFrame === false || outletFrameId === lastOutletFrameId) return;
    const outlets = new Set([outletFrameId]);
    this.bringSelectedOutletFrameToFront(outlets);
  }

  private bringSelectedOutletFrameToFront(outlets: Set<string>) {
    const order = [...this.outletFrameOrder$.getValue()];
    this.outletFrameOrder = utils.bringOutletToFront(order, outlets);
  }

  checkOutletFrameSelection(rect: cd.IRect, canvasPosition: cd.ICanvasPosition) {
    const selRect = utils.selectionRectFromCanvas(rect, canvasPosition);
    const { outletFrameRects } = this;
    const selected = Array.from(outletFrameRects.entries()).reduce<string[]>((acc, curr) => {
      const [key, value] = curr;
      const frame = value.frame;
      if (rectsIntersect(frame, selRect)) {
        acc.push(key);
      }
      return acc;
    }, []);

    const selection = this.selection$.getValue();
    const selectedLength = selected.length;

    if (selectedLength) {
      const same =
        selection.size === selectedLength && selected.every((item) => selection.has(item));
      if (same === false) this.selectOutletFrames(selected);
    } else {
      if (selection.size >= 1) this.deselectAll();
    }
  }

  deselectAll() {
    if (this.selection$.getValue().size === 0) return; // already deselected
    this.dispatch(new actions.SelectionDeselectAll());
  }

  isSelected(id: string): boolean {
    const { _selectionState } = this;
    if (!_selectionState) return false;
    return _selectionState.ids.has(id);
  }

  dispatch(action: any) {
    if (!this._projectStore) return;
    this._projectStore.dispatch(action);
  }

  toggleElements(ids: string[], append = false, allowDeselect = false) {
    this.dispatch(new actions.SelectionToggleElements(ids, append, allowDeselect));
  }

  selectOutletFrames(outletFrameIds: string[]) {
    this.dispatch(new actions.SelectionSet(new Set(outletFrameIds), true));
  }

  startInteracting() {
    this.interacting = true;
    this.resetHighlight();
  }

  stopInteracting(isOutletFrame: boolean = false) {
    if (!isOutletFrame) this.interacting = false;
  }

  get outletFrameRects() {
    return this.outletFrameRects$.getValue();
  }

  get selectedOutletFrames(): ReadonlyArray<cd.IRenderResult> {
    const { outletFrameRects } = this;
    const selected = Array.from(this.selection$.getValue().keys());
    return selected.reduce<cd.IRenderResult[]>((acc, value) => {
      const item = outletFrameRects.get(value);
      if (item) acc.push(item);
      return acc;
    }, []);
  }

  // prettier-ignore
  moveOutletFrame(dx: number, dy: number, clientX: number, clientY: number, z: number) {
    const { selectedOutletFrames, outletFrameRects, _snappedPos } = this;
    const selectedIRect = snapUtils.rectFromSelectedOutlets(selectedOutletFrames);
    const lines = snapUtils.generateSnapLines(selectedOutletFrames, outletFrameRects, selectedIRect);
    const snapPoint = snapUtils.generateSnapPointFromDelta(selectedIRect, dx, dy, lines);
    const newPosAndDelta = snapUtils.generateClientPosAndDelta(_snappedPos, snapPoint, clientX, clientY, dx, dy, z);
    const [newClientPos] = newPosAndDelta;
    const newRenderMap = snapUtils.snapSelectedOutlets(selectedOutletFrames, outletFrameRects, selectedIRect, snapPoint, newPosAndDelta);
    // Pass client position to be recorded as new snap point
    this._snappedPos.update(...newClientPos);
    this.linePoints$.next(lines);
    this.outletFrameRects$.next(newRenderMap);
  }

  updateOutletFrames(payload: cd.IPropertiesUpdatePayload[]) {
    this.dispatch(new ElementPropertiesUpdate(payload));
  }

  publishSelectedOutletFrameRects() {
    const update = this.selectedOutletFrames.map((item) => {
      const rounded = utils.roundOutletFrameToGrid(item.frame);
      const frame = utils.clampOutletFrameDimensions(rounded);
      return buildPropertyUpdatePayload(item.rootId, { frame });
    });
    this.updateOutletFrames(update);
  }

  endOutletFrameMove(changed: boolean) {
    if (changed) this.publishSelectedOutletFrameRects();
    this.boardMoving$.next(false);
    this.interacting = false;
    this.linePoints$.next([]);
  }

  updateElementRect(id: string, frame: cd.IRect, publish = false) {
    const outletFrameRects = new Map([...this.outletFrameRects]);
    const item = outletFrameRects.get(id);
    if (item) {
      const clone = { ...item, frame: { ...frame } };
      outletFrameRects.set(id, clone);
      this.outletFrameRects$.next(outletFrameRects);
    }
    if (publish) {
      this.publishOutletFrameRects(id);
    }
  }

  publishOutletFrameRects(id: string) {
    const outletFrame = this.outletFrameRects.get(id)?.frame;
    if (!outletFrame) return;
    const rounded = utils.roundOutletFrameToGrid(outletFrame);
    const frame = utils.clampOutletFrameDimensions(rounded);
    const update = buildPropertyUpdatePayload(id, { frame });
    this.updateOutletFrames([update]);
  }

  renderRectsForIds = (mergeWithOutlets: boolean, ...ids: string[]): cd.RenderRectMap => {
    const rects = mergeWithOutlets ? this.mergedRenderRects : this.renderRects;
    return ids.reduce((acc, curr) => {
      const found = rects.get(curr);
      if (found) acc.set(curr, found);
      return acc;
    }, new Map());
  };

  renderRectForId = (id: string): cd.IRenderResult | undefined => {
    return this.renderRects.get(id);
  };

  isolateSymbol = (symbolInstance: cd.ISymbolInstanceProperties) => {
    const payload: IConfigPayload = { propertyModels: [symbolInstance] };
    this.dispatch(new actions.PanelIsolateSymbol(null, payload));
  };

  snapToBoardWithId = (id?: string | null) => {
    if (!id) return;
    const board = this._elementProperties[id];
    if (!board) return;
    this.dispatch(new actions.CanvasSnapToBoard(null, { propertyModels: [board] }));
  };

  snapToBoardAndSelect = (id?: string | null) => {
    if (!id) return;
    this.snapToBoardWithId(id);
    this.selectOutletFrames([id]);
  };
}
