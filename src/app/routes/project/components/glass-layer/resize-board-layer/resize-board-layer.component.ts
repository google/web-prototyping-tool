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
  OnDestroy,
  HostListener,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import { AbstractResizeLayer } from '../resize-layer/abstract.resize';
import { generateBoardSizes, areSizesEqual, IBoardItem } from './board-size.utils';
import { PropertiesService } from '../../../services/properties/properties.service';
import { InteractionService } from '../../../services/interaction/interaction.service';
import { ElementPropertiesUpdate, IProjectState, SelectionSet } from '../../../store';
import { removePtFromOutletFrame, buildBaseStylePropsUpdate } from 'cd-common/utils';
import { ILineAttr, IAnchorPoint } from '../resize-layer/resize.interfaces';
import { InfoTextComponent } from '../info-text/info-text.component';
import ResizeRect, * as utils from '../resize-layer/resize.utils';
import { deselectActiveElement } from 'cd-utils/selection';
import { MouseButton } from 'cd-utils/keycodes';
import { Subscription, fromEvent } from 'rxjs';
import { Store } from '@ngrx/store';
import * as cd from 'cd-interfaces';

const OUTLET_FRAME_PUBLISH_TIMEOUT = 100;

@Component({
  selector: 'g[app-resize-board-layer]',
  templateUrl: './resize-board-layer.component.html',
  styleUrls: ['./resize-board-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizeBoardLayerComponent extends AbstractResizeLayer implements OnDestroy {
  private _timer = 0;
  private _outletFrame?: cd.IRenderResult;

  public boardSizes: IBoardItem[] = [];
  public hasSelection = false;
  public fontSize = '';
  public rightEdge?: ILineAttr;
  public bottomEdge?: ILineAttr;
  public topEdge?: ILineAttr;
  public leftEdge?: ILineAttr;
  public rightHandle?: ILineAttr;
  public bottomHandle?: ILineAttr;
  public isSelected = false;
  public lines: ReadonlyArray<ILineAttr> = [];
  public anchors: ReadonlyArray<IAnchorPoint> = [];

  @Input()
  get outletFrame(): cd.IRenderResult | undefined {
    return this._outletFrame;
  }
  set outletFrame(value: cd.IRenderResult | undefined) {
    this._outletFrame = value;
    this.update();
  }

  @Input()
  @HostBinding('class.debug')
  debug = false;

  @Input() rootId = '';

  @Input()
  set zoom(zoom: number) {
    if (zoom === this._zoom) return;
    this.updateSizesFromZoom(zoom);
    this._zoom = zoom;
    this.update();
  }
  get zoom() {
    return this._zoom;
  }

  @Input()
  set selection(values: string[]) {
    this.hasSelection = !!(values && values.length !== 0);
    this.isSelected = this.hasSelection && values.indexOf(this.rootId) !== -1;
    this.update();
  }

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _projectStore: Store<IProjectState>,
    private _propertiesService: PropertiesService,
    private _interactionService: InteractionService
  ) {
    super();
  }

  update() {
    const { outletFrame } = this;
    if (!outletFrame) return;
    this.updateResizeText();
    const innerRect = removePtFromOutletFrame(outletFrame.frame);
    this.updateLines(innerRect);
    this.updateAnchors(innerRect);
  }

  getPropForId(elementId?: string) {
    return elementId && this._propertiesService.getPropertiesForId(elementId);
  }

  selectFrameIfNotSelected(rootId: string) {
    const action = new SelectionSet(new Set([rootId]), true);
    this._projectStore.dispatch(action);
  }

  @HostListener('pointerdown', ['$event'])
  onResizeStart(e: PointerEvent) {
    if (e.button !== MouseButton.Left) return; // only listen for mousedown on left click
    const edge = utils.edgeFromTarget(e.target as SVGElement);
    if (edge === undefined) return;
    const { rootId } = this;
    this._hasResized = false;
    deselectActiveElement();
    if (!rootId) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    clearTimeout(this._timer);
    const { outletFrame } = this;
    if (outletFrame) {
      const { screenX, screenY } = e;
      this.selectFrameIfNotSelected(rootId);
      const prop = this.getPropForId(rootId);
      this._interactionService.startInteracting();
      const locked = !!(prop && prop.frame.locked);
      this.resizeRect = new ResizeRect(outletFrame.frame, this._zoom, edge, locked);
      this.resizeRect.orient(screenX, screenY);
      this.addListeners();
    }
  }

  addListeners() {
    this._subscription = new Subscription();
    this._subscription.add(this.getPointerCancel().subscribe(this.onResizeEnd));
    const move$ = fromEvent<PointerEvent>(window, 'pointermove');
    this._subscription.add(move$.subscribe(this.onResize));
  }

  onResize = (e: PointerEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.dragPointerId = e.pointerId;
    if (this._hasResized === false) this._hasResized = true;
    if (!this.resizeRect || !this.rootId) return;
    const { screenX, screenY, shiftKey, altKey } = e;
    const { rootId, resizeRect } = this;
    resizeRect.resize(screenX, screenY, shiftKey, altKey);
    this.updateBoardSizes(resizeRect.width, resizeRect.height);
    this._interactionService.updateElementRect(rootId, resizeRect.frame);
    this._cdRef.markForCheck();
  };

  updateElementSize(elementId: string, sizePartial: cd.IStyleDeclaration) {
    const update = buildBaseStylePropsUpdate(elementId, sizePartial);
    this._projectStore.dispatch(new ElementPropertiesUpdate([update]));
  }

  updateResizeText() {
    const { resizeRect, _zoom, rootId } = this;
    if (!resizeRect || !rootId) return;
    const { BKD_HEIGHT } = InfoTextComponent;
    const renderRect = this.outletFrame;
    const { frame } = resizeRect;
    const elementFrame = (renderRect && renderRect.frame) || frame;
    const rect = rootId === this.rootId ? removePtFromOutletFrame(frame) : elementFrame;
    const contentWidth = this.updateTextAndReturnLength(frame);
    const pos = utils.contentPositionForEdge(resizeRect, rect, _zoom, contentWidth, BKD_HEIGHT);
    this.infoTextPosition = pos;
  }

  onResizeEnd = (e: PointerEvent) => {
    this.stopPropagation(e);
    this.removeListeners();
    const { rootId } = this;
    this.resizeText = '';

    if (this.resizeRect && rootId) {
      this.resizeRect.resetCursor();
      this._interactionService.stopInteracting(true);
      if (this._hasResized === true) {
        this.publishOutletFrame(rootId);
      }
      this.resizeRect = undefined;
    }

    this._cdRef.markForCheck();
  };

  publishOutletFrame(elementId: string) {
    this._interactionService.publishOutletFrameRects(elementId);
    clearTimeout(this._timer);
    this._timer = window.setTimeout(() => {
      this._interactionService.interacting = false;
    }, OUTLET_FRAME_PUBLISH_TIMEOUT);
  }

  removeListeners() {
    this.resetPointerCapture();
    this._subscription.unsubscribe();
  }

  ngOnDestroy(): void {
    clearTimeout(this._timer);
    this.removeListeners();
  }

  updateBoardSizes(resizeWidth: number, resizeHeight: number) {
    const sizes = generateBoardSizes(resizeWidth, resizeHeight);
    if (areSizesEqual(this.boardSizes, sizes)) return;
    this.boardSizes = sizes;
  }
}
