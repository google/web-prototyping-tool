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
  HostListener,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { InteractionService } from '../../../services/interaction/interaction.service';
import { PropertiesService } from '../../../services/properties/properties.service';
import { RendererService } from 'src/app/services/renderer/renderer.service';
import { IProjectState, ElementPropertiesUpdate } from '../../../store';
import { InfoTextComponent } from '../info-text/info-text.component';
import { buildBaseStylePropsUpdate, removePtFromOutletFrame } from 'cd-common/utils';
import { Subscription, fromEvent } from 'rxjs';
import { AbstractResizeLayer } from './abstract.resize';
import { deselectActiveElement } from 'cd-utils/selection';
import { didValueChangeForKey } from '../glass.utils';
import { MouseButton } from 'cd-utils/keycodes';
import { UnitTypes } from 'cd-metadata/units';
import { EDGE } from 'cd-utils/geometry';
import { Store } from '@ngrx/store';
import ResizeRect, * as utils from './resize.utils';
import * as models from 'cd-common/models';
import * as cd from 'cd-interfaces';

const EDGE_DOUBLE_CLICK_ZOOM_THRESHOLD = 0.2;

@Component({
  selector: 'g[app-resize-layer]',
  templateUrl: './resize-layer.component.html',
  styleUrls: ['./resize-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizeLayerComponent extends AbstractResizeLayer implements OnDestroy, OnChanges {
  private _elementType?: cd.ElementEntitySubType | string;
  public isValidRect = false;
  public elementId: string | undefined;
  public canResize = true;

  @Input() rootId = '';
  @Input() renderRects: cd.RenderRectMap = new Map();
  @Input() values: string[] = [];
  @Input() zoom = 1;

  @Input()
  @HostBinding('class.debug')
  debug = false;

  constructor(
    private _interactionService: InteractionService,
    private _propertiesService: PropertiesService,
    private _projectStore: Store<IProjectState>,
    private _rendererService: RendererService,
    private _cdRef: ChangeDetectorRef
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Prevent duplicate recalculation on changes
    let update = false;

    const zoomChange = didValueChangeForKey<this>('zoom', changes);

    if (zoomChange) {
      this.updateSizesFromZoom(this.zoom);
      update = true;
    }

    if (changes.values || changes.rootId) {
      if (this.buildValueChanges()) {
        update = true;
      }
    }

    if (changes.renderRects) {
      update = true;
    }

    if (update) {
      this.updateElement();
    }
  }

  get isActive() {
    return this.elementId && this.canResize && this.isValidRect;
  }

  buildValueChanges(): boolean {
    const elemId = this.values?.[0];
    if (elemId === this.elementId) return false;
    if (elemId === this.rootId) {
      this.elementId = undefined;
      return false;
    }

    this.elementId = elemId;
    const prop = this.getPropForId(elemId);
    this._elementType = prop ? prop.elementType : undefined;
    const cmp = models.getComponent(this._elementType);
    if (!cmp) return false;
    this.canResize = cmp?.preventResize !== true;
    return true;
  }

  getPropForId(elementId?: string) {
    return elementId && this._propertiesService.getPropertiesForId(elementId);
  }

  updateElement() {
    const { elementId } = this;
    if (!elementId) return;
    const { canResize } = this;
    if (!canResize) return;
    const elementRect = this.renderRects.get(elementId);
    const rect = elementRect?.frame;
    this.isValidRect = rect !== undefined && rect.width + rect.height > 0;
    if (!rect) return;
    this.updateLines(rect);
    this.updateAnchors(rect);
    this.updateResizeText();
  }

  updateResizeText() {
    const { resizeRect, zoom, elementId } = this;
    if (!resizeRect || !elementId) return;
    const { BKD_HEIGHT } = InfoTextComponent;
    const renderRect = this.renderRects.get(elementId);
    const { frame } = resizeRect;
    const elementFrame = (renderRect && renderRect.frame) || frame;
    const rect = elementId === this.rootId ? removePtFromOutletFrame(frame) : elementFrame;
    const contentWidth = this.updateTextAndReturnLength(frame);
    const pos = utils.contentPositionForEdge(resizeRect, rect, zoom, contentWidth, BKD_HEIGHT);
    this.infoTextPosition = pos;
  }

  unitsFromIValue(value?: cd.IValue): cd.Units | undefined {
    return value?.units || UnitTypes.Pixels;
  }

  generateSizePayload(size: utils.IResizePayload): cd.IStyleDeclaration {
    const { _elementType } = this;
    const isIcon = _elementType === cd.ElementEntitySubType.Icon;
    if (isIcon && size.width) {
      Object.assign(size, { fontSize: { ...size.width } });
    }
    return size;
  }

  publishElementFrameToRenderer(elementId: string, frame: cd.IRect, lockedAspectRatio: boolean) {
    const { _resizeTracker } = this;
    if (!_resizeTracker) return;
    const size = _resizeTracker.update(frame, lockedAspectRatio);
    if (!size) return;
    const payload = this.generateSizePayload(size);
    const update = buildBaseStylePropsUpdate(elementId, payload);
    this._rendererService.updateElementPropertiesPartial([update]);
  }

  getInitialPayload(elementId: string, elementFrame: cd.IRect) {
    const styles = this._propertiesService.getActiveStylesForId(elementId);
    const width = styles && styles.width;
    const height = styles && styles.height;
    const outletFrameRect = this.renderRects.get(this.rootId);
    const outletFrame = outletFrameRect && outletFrameRect.frame;
    this._resizeTracker = new utils.ResizeTracker(width, height, elementFrame, outletFrame);
  }

  @HostListener('dblclick', ['$event'])
  onDoubleClick(e: MouseEvent) {
    // Ignore double click when zoomed out
    if (this.zoom < EDGE_DOUBLE_CLICK_ZOOM_THRESHOLD) return;
    const edge = utils.edgeFromTarget(e.target as SVGElement);
    if (edge === undefined) return;
    const { elementId } = this;
    const prop = this.getPropForId(elementId);
    if (prop && prop.frame.locked) return;
    if (!elementId || !prop) return;
    const style = models.getActiveStyleFromProperty(prop);
    if (!style) return;
    const value = this.valueForEdge(style, edge);
    if (value) {
      this.updateElementSize(elementId, value);
    }
  }

  @HostListener('pointerdown', ['$event'])
  onResizeStart(e: PointerEvent) {
    if (e.button !== MouseButton.Left) return; // only listen for mousedown on left click
    const edge = utils.edgeFromTarget(e.target as SVGElement);
    if (edge === undefined) return;
    const { elementId } = this;
    this.hasResized = false;
    deselectActiveElement();
    if (!elementId) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    this.listenForResize(elementId, e, edge);
  }

  listenForResize(elementId: string, e: PointerEvent, edge: EDGE) {
    const item = this.renderRects.get(elementId);
    if (!item) return;
    const { screenX, screenY } = e;
    this.getInitialPayload(elementId, item.frame);
    const prop = this.getPropForId(elementId);
    const locked = !!(prop && prop.frame.locked);
    this.resizeRect = new ResizeRect(item.frame, this.zoom, edge, locked);
    this.resizeRect.orient(screenX, screenY);
    this._subscription = new Subscription();
    this._subscription.add(this.getPointerCancel().subscribe(this.onResizeEnd));
    const move$ = fromEvent<PointerEvent>(window, 'pointermove');
    this._subscription.add(move$.subscribe(this.onResize));
  }

  get isRoot() {
    return this.elementId === this.rootId;
  }

  set hasResized(value: boolean) {
    if (value === this._hasResized) return;
    this._hasResized = value;
    if (value) this._interactionService.startInteracting();
  }

  onResize = (e: PointerEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.dragPointerId = e.pointerId;
    this.hasResized = true;
    if (!this.resizeRect || !this.elementId) return;
    const { screenX, screenY, shiftKey, altKey } = e;
    const { elementId, resizeRect } = this;
    resizeRect.resize(screenX, screenY, shiftKey, altKey);
    const locked = resizeRect.lockedRatio || shiftKey;
    this.publishElementFrameToRenderer(elementId, resizeRect.frame, locked);

    this._cdRef.markForCheck();
  };

  onResizeEnd = (e: PointerEvent) => {
    this.stopPropagation(e);
    this.removeListeners();
    const { elementId } = this;
    this.resizeText = '';

    if (this.resizeRect && elementId) {
      this.resizeRect.resetCursor();
      this._interactionService.stopInteracting(false);
      if (this._hasResized === true) {
        this.publishElementProperties();
      }
      this.resizeRect = undefined;
    }

    this._cdRef.markForCheck();
  };

  publishElementProperties() {
    const { _resizeTracker, elementId } = this;
    const prop = this.getPropForId(elementId);
    if (prop && _resizeTracker && elementId) {
      const locked = prop.frame.locked;
      const size = _resizeTracker.finalValue(locked);
      if (size) {
        const payload = this.generateSizePayload(size);
        this.updateElementSize(elementId, payload);
      }
      this._resizeTracker = undefined;
    }
  }

  removeListeners() {
    this.resetPointerCapture();
    this._subscription.unsubscribe();
  }

  ngOnDestroy(): void {
    this.removeListeners();
  }

  updateElementSize(elementId: string, sizePartial: cd.IStyleDeclaration) {
    const update = buildBaseStylePropsUpdate(elementId, sizePartial);
    this._projectStore.dispatch(new ElementPropertiesUpdate([update]));
  }

  valueForEdge({ width, height }: cd.IStringMap<cd.IValue>, edge: EDGE) {
    // prettier-ignore
    switch (edge) {
      case EDGE.Left:
      case EDGE.Right: return utils.getFullWidth(width);
      case EDGE.Top:
      case EDGE.Bottom: return utils.getFullHeight(height);
      case EDGE.TopRight:
      case EDGE.TopLeft:
      case EDGE.BottomLeft:
      case EDGE.BottomRight: return utils.getFullDimensions(width, height);
      default: return;
    }
  }
}
