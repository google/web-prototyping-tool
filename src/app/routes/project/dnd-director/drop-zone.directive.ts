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

import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { FlatLayersNode } from '../interfaces/layers.interface';
import { DndDirectorService } from './dnd-director.service';
import { hasMouseMoved } from './dnd-utils';

@Directive({ selector: '[appTreeDropZone]' })
export class TreeDropZoneDirective implements OnDestroy, OnInit {
  private _subscription: Subscription = Subscription.EMPTY;
  private _hostSubscriptions = new Subscription();
  private _active = false;

  @Input('appTreeDropZone') layersNode?: FlatLayersNode;
  @Input() expanded = false;

  constructor(private _elementRef: ElementRef, private _dndDirector: DndDirectorService) {}

  get hostElement(): HTMLElement {
    return this._elementRef.nativeElement;
  }

  get ancestors(): string[] {
    return this.layersNode?.ancestors || [];
  }

  ngOnInit(): void {
    this._subscription = this._dndDirector.dragActive$.subscribe(this._onDragActive);
    // If the drag is active when this directive initializes  Fixes b/134957485
    if (this._dndDirector.dragActive) this._setupDragListeners();
  }

  private _removeDragListeners = () => {
    this._hostSubscriptions.unsubscribe();
  };

  ngOnDestroy() {
    this._removeDragListeners();
    this._subscription.unsubscribe();
  }

  private _setupDragListeners = () => {
    const { hostElement } = this;
    this._hostSubscriptions.unsubscribe();
    this._hostSubscriptions = new Subscription();

    const move$ = fromEvent<MouseEvent>(hostElement, 'mousemove').pipe(
      distinctUntilChanged(hasMouseMoved)
    );
    const enter$ = fromEvent<MouseEvent>(hostElement, 'mouseenter');
    const up$ = fromEvent<MouseEvent>(hostElement, 'mouseup');
    this._hostSubscriptions.add(enter$.subscribe(this._onDragEnter));
    this._hostSubscriptions.add(up$.subscribe(this._onDrop));
    this._hostSubscriptions.add(move$.subscribe(this.onDragOver));
  };

  private _onDragActive = (active: boolean) => {
    if (this._active === active) return;
    this._active = active;
    if (active) {
      this._setupDragListeners();
    } else {
      this._removeDragListeners();
    }
  };

  private _onDragEnter = () => {
    this._dndDirector.handleDragEnter(this.layersNode?.id);
  };

  private _onDrop = () => {
    this._dndDirector.handleDrop();
  };

  private onDragOver = (e: MouseEvent) => {
    const { layersNode, expanded } = this;
    if (!layersNode) return;
    return this._dndDirector.handleDragOverTreeCell(e, layersNode, expanded);
  };
}
