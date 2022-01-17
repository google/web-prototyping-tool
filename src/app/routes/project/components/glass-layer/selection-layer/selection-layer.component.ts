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
import { areObjectsEqual } from 'cd-utils/object';
import { cloneOutletAndRemoveCoordinates } from '../glass.utils';
import * as cd from 'cd-interfaces';

const BORDER_SIZE = 1;

@Component({
  selector: 'g[app-selection-layer]',
  templateUrl: './selection-layer.component.html',
  styleUrls: ['./selection-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionLayerComponent implements OnChanges {
  public borderSize = BORDER_SIZE;
  public selection: ReadonlyArray<cd.IRenderResult> = [];

  @Input() outletFrame?: cd.IRenderResult;
  @Input() values: ReadonlyArray<string> = [];
  @Input() renderRects: cd.RenderRectMap = new Map();
  @Input() rootId = '';

  constructor(private _cdRef: ChangeDetectorRef) {
    this._cdRef.detach();
  }

  buildSelection() {
    const { values, renderRects, outletFrame } = this;
    if (!values) {
      if (!this.selection.length) return;
      this.selection = [];
      this._cdRef.detectChanges();
      return;
    }
    if (!outletFrame) return;

    const outletClone = cloneOutletAndRemoveCoordinates(outletFrame);
    const selection = values.reduce<cd.IRenderResult[]>((acc, id) => {
      const rect = id === outletClone.id ? outletClone : renderRects.get(id);
      if (!rect) return acc;
      acc.push(rect);
      return acc;
    }, []);

    if (areObjectsEqual(selection, this.selection)) return;
    this.selection = selection;
    this._cdRef.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.renderRects || changes.values || changes.outletFrame) {
      this.buildSelection();
    }
  }

  public trackFn(_index: number, item: cd.IRenderResult): string {
    return item.id;
  }
}
