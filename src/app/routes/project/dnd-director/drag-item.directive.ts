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

import { createAssetInstance, createCodeComponentInstance, isRoot } from 'cd-common/models';
import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { DragItemType, hasMouseMoved, hasMouseMovedSinceDown } from './dnd-utils';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { FlatLayersNode } from '../interfaces/layers.interface';
import { createInstanceOfSymbol } from '../utils/symbol.utils';
import { DndDirectorService } from './dnd-director.service';
import { deselectActiveElement } from 'cd-utils/selection';
import { IPoint, createPoint } from 'cd-utils/geometry';
import { PropertiesService } from '../services/properties/properties.service';
import { AnalyticsEvent, AnalyticsEventType } from 'cd-common/analytics';
import { MouseButton } from 'cd-utils/keycodes';
import { Subscription, fromEvent } from 'rxjs';
import { createId } from 'cd-utils/guid';
import * as cd from 'cd-interfaces';

@Directive()
class DragItemDirective implements OnDestroy, OnInit {
  private _subscription: Subscription = Subscription.EMPTY;
  private _downListener: Subscription = Subscription.EMPTY;
  protected handleMousedown = true;
  protected roundedCorners = false;
  protected offsetStart: IPoint = createPoint();
  protected dragType: DragItemType = DragItemType.Default;

  constructor(
    protected _elementRef: ElementRef,
    protected _dndDirector: DndDirectorService,
    protected _propsService: PropertiesService,
    protected _analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    if (!this.handleMousedown) return;
    const move$ = fromEvent<MouseEvent>(this.hostElement, 'mousedown');
    this._downListener = move$.subscribe(this.onMouseDown);
  }

  logAnalyticsEvent(evt: AnalyticsEventType) {
    this._analyticsService.logEvent(evt);
  }

  clearSubscription = () => {
    this._subscription.unsubscribe();
  };

  ngOnDestroy() {
    this.clearSubscription();
    this._downListener.unsubscribe();
  }

  get hostElement() {
    return this._elementRef.nativeElement;
  }

  get bounds() {
    return this.hostElement.getBoundingClientRect();
  }

  onMouseDown = (e: MouseEvent) => {
    if (this._dndDirector.dragActive) return;
    const { button, clientX, clientY, pageX, pageY } = e;
    if (button !== MouseButton.Left) return;
    const { left, top } = this.bounds;
    const dragOffsetX = pageX - left;
    const dragOffsetY = pageY - top;
    this.offsetStart = createPoint(dragOffsetX, dragOffsetY);
    const startPoint = createPoint(clientX, clientY);
    this.listenForDragStart(startPoint);
  };

  listenForDragStart(sp: IPoint) {
    const up$ = fromEvent<MouseEvent>(window, 'mouseup', { capture: true });
    this._subscription = fromEvent<MouseEvent>(window, 'mousemove')
      .pipe(
        distinctUntilChanged(hasMouseMoved),
        filter((e) => hasMouseMovedSinceDown(e, sp)),
        takeUntil(up$)
      )
      .subscribe(this.onDragStart);
  }

  /** This only initalizes drag start, now the director takes over */
  onDragStart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.clearSubscription();
    deselectActiveElement();
    this.setDragItems(e);
    const { bounds, dragType, roundedCorners, offsetStart } = this;
    const { width, height } = bounds;
    this._dndDirector.handleDragStart(width, height, dragType, offsetStart, roundedCorners);
  };

  setDragItems(_e: MouseEvent) {}
}

@Directive({ selector: '[appTreeDragItem]' })
export class TreeDragItemDirective extends DragItemDirective {
  public dragType = DragItemType.TreeNode;
  protected handleMousedown = false;
  public offsetWidth = 18;

  @Input('appTreeDragItem') layersNode?: FlatLayersNode;

  get id() {
    return this.layersNode?.id;
  }

  get nodeIsRoot() {
    return this.layersNode && isRoot(this.layersNode);
  }

  get bounds() {
    const { top, left, width: w, height: h } = this.hostElement.getBoundingClientRect();
    const width = w - this.offsetWidth;
    const height = h;
    return { top, left, width, height };
  }

  setDragItems(e: MouseEvent) {
    const { layersNode, nodeIsRoot } = this;
    if (layersNode && !nodeIsRoot) {
      this._dndDirector.setDragItemById(layersNode.id, e);
    }
  }
}

/**
 * Glass layer Drag Item
 */
@Directive({ selector: '[appGlassRectDragItem]' })
export class GlassRectDragItemDirective extends DragItemDirective {
  private _elementId!: string;
  protected handleMousedown = false;

  @Input('appGlassRectDragItem')
  set elementId(value: string) {
    this._elementId = value;
    if (!value) return;
    this.assignDragType(value);
  }
  get elementId(): string {
    return this._elementId;
  }

  assignDragType(id: string) {
    const elem = this._dndDirector.propertiesFromElementId(id);
    if (!elem) return;
    if (elem.elementType === cd.ElementEntitySubType.Image) {
      this.dragType = DragItemType.Asset;
    }
  }

  setDragItems(e: MouseEvent) {
    const { elementId } = this;
    if (!elementId) return;
    this._dndDirector.setDragItemById(elementId, e);
  }
}
/**
 * Components Panel (Primitives, Material, etc) items
 */
@Directive({ selector: '[appComponentDragItem]' })
export class ComponentDragItemDirective extends DragItemDirective {
  public roundedCorners = true;

  @Input('appComponentDragItem') entity?: cd.ElementEntitySubType;

  setDragItems(_e: MouseEvent) {
    if (this.entity === undefined) return;
    const element = this._dndDirector.buildPropertyModel(this.entity);
    if (!element) return;
    this._dndDirector.setNewDragItems([element.id], [element]);
  }
}

@Directive({ selector: '[appSymbolDragItem]' })
export class SymbolDragItemDirective extends DragItemDirective {
  public roundedCorners = true;

  @Input('appSymbolDragItem') symbol?: cd.ISymbolProperties;

  setDragItems(_e: MouseEvent) {
    const { symbol } = this;
    if (!symbol) return;
    const id = createId();
    const props = this._propsService.getElementProperties();
    const model = createInstanceOfSymbol(props, symbol, id);
    this._dndDirector.setNewDragItems([model.id], [model]);
  }
}

@Directive({ selector: '[appCodeComponentDragItem]' })
export class CodeComponentDragItemDirective extends DragItemDirective {
  public roundedCorners = true;

  @Input('appCodeComponentDragItem') codeComponent?: cd.ICodeComponentDocument;

  setDragItems(_e: MouseEvent) {
    const { codeComponent } = this;
    if (!codeComponent) return;
    const id = createId();
    const codeComponentInstance = createCodeComponentInstance(id, codeComponent);
    this._dndDirector.setNewDragItems([codeComponentInstance.id], [codeComponentInstance]);
    this.logAnalyticsEvent(AnalyticsEvent.CodeComponentInstanceCreated);
  }
}

@Directive({ selector: '[appAssetDragItem]' })
export class AssetDragItemDirective extends DragItemDirective {
  public dragType: DragItemType = DragItemType.Asset;

  @Input('appAssetDragItem') asset!: cd.IProjectAsset;

  setDragItems(_e: MouseEvent) {
    const { asset } = this;
    if (!asset) return;
    const imgId = createId();
    const { width, height, id, name, projectId } = asset;
    const image = createAssetInstance(imgId, projectId, name, id, width, height);
    this._dndDirector.setNewDragItems([image.id], [image]);
  }
}
