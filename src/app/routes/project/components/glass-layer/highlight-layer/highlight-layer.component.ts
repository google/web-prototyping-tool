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
  ChangeDetectorRef,
} from '@angular/core';
import { IRect, RenderRectMap, IRenderResult } from 'cd-interfaces';
import { PropertiesService } from '../../../services/properties/properties.service';
import { areObjectsEqual } from 'cd-utils/object';
import * as utils from '../glass.utils';

const BORDER_SIZE = 2.5;

interface IHighlight extends IRenderResult {
  label?: string;
}

@Component({
  selector: 'g[app-highlight-layer]',
  templateUrl: './highlight-layer.component.html',
  styleUrls: ['./highlight-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HighlightLayerComponent implements OnChanges {
  private _labels = new Map<string, string>();

  public showBounds = false;
  public borderSize = BORDER_SIZE;
  public highlights: ReadonlyArray<IHighlight> = [];

  @Input() showLabel = false;
  @Input() outletFrame?: IRenderResult;
  @Input() scrollRect?: IRect;
  @Input() rootId?: string;
  @Input() values: ReadonlyArray<string> = [];
  @Input() selection: ReadonlyArray<string> = [];
  @Input() renderRects: RenderRectMap = new Map();
  @Input() zoom = 1;

  constructor(private _propertiesService: PropertiesService, private _cdRef: ChangeDetectorRef) {
    this._cdRef.detach();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let markedForCheck = false;

    const zoomChange = utils.didValueChangeForKey<this>('zoom', changes);

    if (zoomChange) {
      const size = BORDER_SIZE / this.zoom;
      if (size !== this.borderSize) {
        this.borderSize = size;
        markedForCheck = true;
      }
    }

    const showLabelChange = utils.didValueChangeForKey<this>('showLabel', changes);
    if (showLabelChange) markedForCheck = true;

    if (changes.values) {
      this.generateLabels(this.values);
    }

    if (changes.values || changes.renderRects || changes.selection) {
      if (this.buildHighlights()) markedForCheck = true;
    }

    if (markedForCheck) {
      this._cdRef.detectChanges();
    }
  }

  get areHighlightsReset() {
    return !this.highlights.length && this.showBounds === false;
  }
  /** Builds highlight rects, if changed return true for change detection */
  buildHighlights(): boolean {
    const { renderRects, values, selection, _labels, outletFrame } = this;
    if (!values) {
      if (this.areHighlightsReset) return false;
      this.highlights = [];
      this.showBounds = false;
      return true;
    }

    const highlights = values.reduce<IHighlight[]>((acc, id) => {
      if (selection && selection.includes(id)) return acc;
      const rect = utils.rectFromOutletOrRenderRects(id, renderRects, outletFrame);
      const label = _labels.get(id);
      if (!rect) return acc;
      acc.push({ ...rect, label });
      return acc;
    }, []);

    const showBounds = this.valuesAreWithinBounds(values, renderRects);
    if (showBounds === this.showBounds && areObjectsEqual(highlights, this.highlights)) {
      return false;
    }

    this.showBounds = showBounds;
    this.highlights = highlights;
    return true;
  }

  generateLabels(values: ReadonlyArray<string>) {
    if (!values) return;
    const { _propertiesService } = this;
    this._labels = values.reduce((acc, curr) => {
      const elem = _propertiesService.getPropertiesForId(curr);
      if (elem) acc.set(elem.id, elem.name);
      return acc;
    }, new Map());
  }

  isNotSelected(id: string): boolean {
    return this.selection.includes(id) === false;
  }

  valuesAreWithinBounds(values: ReadonlyArray<string> = [], renderRects: RenderRectMap) {
    const { outletFrame, scrollRect, rootId } = this;
    const outletFrameRect = outletFrame?.frame;
    if (!outletFrameRect || !scrollRect) return false;
    const [first] = values;
    const isRoot = first === rootId;
    if (isRoot || utils.areRectDimensionsEqual(outletFrameRect, scrollRect)) return false;
    return utils.areRectsWithinBounds(outletFrameRect, values, renderRects);
  }

  public trackFn(_index: number, item: IHighlight): string {
    return item.id;
  }
}
