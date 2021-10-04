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
  OnChanges,
  SimpleChanges,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { DndDirectorService } from '../../../dnd-director/dnd-director.service';
import { adjustFrameByRoot } from '../../../dnd-director/dnd-surface.utils';
import { PropertiesService } from '../../../services/properties/properties.service';
import { DndSurfaceService } from '../../../dnd-director/dnd-surface.service';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { rectsIntersect } from 'cd-common/utils';
import { areObjectsEqual } from 'cd-utils/object';
import { Subscription } from 'rxjs';
import * as cd from 'cd-interfaces';

interface IDragRect extends cd.IRect {
  id: string;
  rootId: string;
  hidden?: boolean;
}

@Component({
  selector: 'g[app-drag-layer]',
  templateUrl: './drag-layer.component.html',
  styleUrls: ['./drag-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragLayerComponent implements OnChanges, OnInit, OnDestroy {
  private _subscriptions = Subscription.EMPTY;
  private _parentId?: string;
  public parentRect?: cd.IRect;
  public dragRects: ReadonlyArray<IDragRect> = [];

  @Input() renderRects: cd.RenderRectMap = new Map();

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _dndDirector: DndDirectorService,
    private _surfaceService: DndSurfaceService,
    private _propertiesService: PropertiesService
  ) {}

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  parentIdFromDropLocation = (dl?: cd.IInsertLocation): string | undefined => {
    if (!dl) return;
    const beforeOrAfter =
      dl.relation === cd.InsertRelation.Before ||
      dl.relation === cd.InsertRelation.After ||
      dl.relation === cd.InsertRelation.AfterGroup;

    const elem = this._propertiesService.getPropertiesForId(dl.elementId);
    return beforeOrAfter ? elem?.parentId : dl.elementId;
  };

  ngOnInit(): void {
    // fine grain change detection control
    this._cdRef.detach();
    this.setInitalParent();
    this._subscriptions = this._dndDirector.dropLocation$
      .pipe(map(this.parentIdFromDropLocation), distinctUntilChanged())
      .subscribe(this.onParentIdUpdate);
  }

  onParentIdUpdate = (parentId?: string) => {
    if (!parentId && this._surfaceService.isAbsoluteDrag) return;
    this.parentId = parentId;
  };

  setInitalParent() {
    const { dragIds } = this._dndDirector;
    if (!dragIds.length) return;
    const [firstId] = dragIds;
    const elem = this._propertiesService.getPropertiesForId(firstId);
    if (!elem) return;
    this.parentId = elem?.parentId || elem.id;
    this.updateRenderRects();
  }

  resetParentId() {
    this.parentId = undefined;
    this.parentRect = undefined;
  }

  set parentId(id: string | undefined) {
    if (id === this._parentId) return;
    this._parentId = id;
    if (!id) {
      this.parentRect = undefined;
    }
  }

  get parentId() {
    return this._parentId;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.renderRects) this.updateRenderRects();
  }

  updateParentRect(rect: cd.IRect | undefined): boolean {
    if (areObjectsEqual(rect, this.parentRect)) return false;
    this.parentRect = rect;
    return true;
  }

  updateParent(renderRects: cd.RenderRectMap, parentId?: string): boolean {
    if (!parentId) return false;
    const rect = renderRects.get(parentId);
    if (!rect) return false;
    const { rootId, frame } = rect;
    const isRoot = rootId === parentId;
    const rootFrame = this.getFrameFromRoot(rootId);
    if (isRoot) return this.updateParentRect(rootFrame);
    if (!rootFrame) return false;
    const parentRect = adjustFrameByRoot(frame, rootFrame);
    return this.updateParentRect(parentRect);
  }

  trackByFn(_idx: number, rect: IDragRect) {
    return rect.id;
  }

  getFrameFromRoot(rootId: string): cd.IRect | undefined {
    return this._propertiesService.getPropertiesForId(rootId)?.frame;
  }

  updateDragRects(renderRects: cd.RenderRectMap): boolean {
    const { dragIds } = this._dndDirector;
    const { isAbsoluteDrag } = this._surfaceService;
    const rootRectMap = new Map<string, cd.IRect>();
    const dragRects = dragIds.reduce<IDragRect[]>((acc, id) => {
      const rect = renderRects.get(id);
      if (!rect) return acc;
      const { rootId } = rect;
      const rootRect = rootRectMap.get(rootId) || this.getFrameFromRoot(rootId);
      if (!rootRect) return acc;
      if (!rootRectMap.has(rootId)) rootRectMap.set(rootId, rootRect);
      const frame = adjustFrameByRoot(rect.frame, rootRect);
      // Dont render if absolute position and dragging over board
      const hidden = isAbsoluteDrag && rectsIntersect(frame, rootRect);
      acc.push({ ...frame, id, rootId, hidden });
      return acc;
    }, []);

    if (areObjectsEqual(this.dragRects, dragRects)) return false;
    this.dragRects = dragRects;
    return true;
  }

  updateRenderRects() {
    const { renderRects, parentId } = this;
    const parentRectUpdate = this.updateParent(renderRects, parentId);
    const dragRectUpdate = this.updateDragRects(renderRects);
    // only update when things change
    if (parentRectUpdate || dragRectUpdate) {
      this._cdRef.detectChanges();
    }
  }
}
