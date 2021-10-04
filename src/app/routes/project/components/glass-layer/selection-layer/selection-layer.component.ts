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
import { select, Store } from '@ngrx/store';
import { getDarkTheme, IAppState } from 'src/app/store';
import { Observable } from 'rxjs';

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
  public darkTheme$: Observable<boolean>;
  public peerRects: cd.IUserRect[] = [];

  @Input() outletFrame?: cd.IRenderResult;
  @Input() values: ReadonlyArray<string> = [];
  @Input() renderRects: cd.RenderRectMap = new Map();
  @Input() rootId = '';
  @Input() peerSelectionRects: cd.IUserRect[] = [];

  constructor(private _cdRef: ChangeDetectorRef, private store: Store<IAppState>) {
    this.darkTheme$ = this.store.pipe(select(getDarkTheme));
    this._cdRef.detach();
  }

  // Returns true if change detection should be called
  private buildSelection(): boolean {
    const { values, renderRects, outletFrame } = this;
    if (!values?.length) {
      if (!this.selection.length) return false;
      this.selection = [];
      return true;
    }
    if (!outletFrame) return false;

    const outletClone = cloneOutletAndRemoveCoordinates(outletFrame);
    const selection = values.reduce<cd.IRenderResult[]>((acc, id) => {
      const rect = id === outletClone.id ? outletClone : renderRects.get(id);
      if (!rect) return acc;
      acc.push(rect);
      return acc;
    }, []);

    if (areObjectsEqual(selection, this.selection)) return false;
    this.selection = selection;
    return true;
  }

  // Returns true if change detection should be called
  private checkPeerSelection(): boolean {
    const { peerSelectionRects, peerRects } = this;
    if (areObjectsEqual(peerRects, peerSelectionRects)) return false;
    this.peerRects = peerSelectionRects;
    return true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    let selectionChanged = false;
    let peerSelectionChanged = false;

    if (changes.renderRects || changes.values || changes.outletFrame) {
      selectionChanged = this.buildSelection();
    }
    if (changes.renderRects || changes.peerSelectionRects || changes.outletFrame) {
      peerSelectionChanged = this.checkPeerSelection();
    }

    if (selectionChanged || peerSelectionChanged) this._cdRef.detectChanges();
  }

  public trackFn(_index: number, item: cd.IRenderResult): string {
    return item.id;
  }

  public peerTrackFn(_index: number, item: cd.IUserRect): string {
    const { sessionId, renderResult } = item;
    const { x, y, width, height } = renderResult.frame;
    return `${sessionId}-${renderResult.id}-${x}-${y}-${width}-${height}`;
  }
}
