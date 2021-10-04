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
  ChangeDetectorRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { PropertiesService } from '../../../../services/properties/properties.service';
import { GridInteractionService } from '../../../layout-engine/grid-props/grid-interaction.service';
import { removePtFromOutletFrame } from 'cd-common/utils';
import { AbstractStyleVisDirective } from '../utils/abstract.vis';
import { rectsForGrid } from '../../../layout-engine/render/layout-renderer';
import { Subscription } from 'rxjs';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'g[app-grid-layer]',
  templateUrl: './grid-layer.component.html',
  styleUrls: ['./grid-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridLayerComponent extends AbstractStyleVisDirective implements OnDestroy, OnInit {
  private _subscription = Subscription.EMPTY;
  public bounds?: cd.IRect;
  public parentBounds?: cd.IRect;
  public gridHover: number[] = [];
  public gridRects: ReadonlyArray<cd.IRect> = [];
  public parentGridRects: ReadonlyArray<cd.IRect> = [];

  constructor(
    private _cdRef: ChangeDetectorRef,
    private _propertiesService: PropertiesService,
    private _gridService: GridInteractionService
  ) {
    super();
  }

  ngOnInit(): void {
    this._subscription = this._gridService.$hover.subscribe(this.onGridHover);
  }

  resetGrid() {
    this.gridRects = [];
    this.parentGridRects = [];
    this.bounds = undefined;
    this.parentBounds = undefined;
  }

  update() {
    const { props } = this;
    if (props.length === 0) return this.resetGrid();

    const [first] = props;
    const { id, parentId } = first;
    const rect = this.getRectForId(id);
    const elementProperties = this._propertiesService.getElementProperties();
    const { mergedRects } = this;
    this.bounds = rect && this.boundsForRect(rect);
    this.gridRects = rectsForGrid(first, mergedRects, elementProperties, this.interacting);
    this.parentGridRects = this.buildParentGrid(parentId, mergedRects, elementProperties);
  }

  onGridHover = (gridHover: number[]) => {
    this.gridHover = gridHover;
    this._cdRef.markForCheck();
  };

  onSubscriptionChange = (_props: cd.PropertyModel[]) => {
    this.update();
  };

  boundsForRect(rect: cd.IRenderResult): cd.IRect {
    return rect.id === rect.rootId ? removePtFromOutletFrame(rect.frame) : rect.frame;
  }

  buildParentGrid(
    parentId: string | undefined,
    renderRects: cd.RenderRectMap,
    elementProperties: cd.ElementPropertiesMap
  ): ReadonlyArray<cd.IRect> {
    if (!parentId) return [];
    const parent = this._propertiesService.getPropertiesForId(parentId);
    if (!parent) return [];
    const parentRect = renderRects.get(parentId);
    this.parentBounds = parentRect && this.boundsForRect(parentRect);
    return rectsForGrid(parent, renderRects, elementProperties, this.interacting);
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
