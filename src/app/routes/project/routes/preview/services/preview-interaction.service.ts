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

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { areObjectsEqual } from 'cd-utils/object';
import type * as cd from 'cd-interfaces';

@Injectable()
export class PreviewInteractionService {
  public selectionActive$ = new BehaviorSubject<boolean>(false);
  public selectedElementId$ = new BehaviorSubject<string | undefined>(undefined);
  public currentHighlightedElementId$ = new BehaviorSubject<string | undefined>(undefined);
  public hoveredTopLevelElementId$ = new BehaviorSubject<string | undefined>(undefined);
  public hoveredGreenLine$ = new BehaviorSubject<cd.IGreenlineRenderResult | undefined>(undefined);
  public hoveredCommentThreadId$ = new BehaviorSubject<string | undefined>(undefined);

  setSelectionActive(value: boolean) {
    if (this.selectionActive$.value === value) return;
    this.selectionActive$.next(value);
  }

  setHoveredCommentThreadId(id?: string) {
    if (this.hoveredCommentThreadId$.value === id) return;
    this.hoveredCommentThreadId$.next(id);
  }

  clearHoveredCommentThreadId() {
    this.setHoveredCommentThreadId(undefined);
  }

  setSelectedElementId(id?: string) {
    if (this.selectedElementId$.value === id) return;
    this.selectedElementId$.next(id);
  }

  clearSelectedElementId() {
    this.setSelectedElementId(undefined);
  }

  setHoveredGreenLine(greenline?: cd.IGreenlineRenderResult) {
    if (areObjectsEqual(greenline, this.hoveredGreenLine$.value)) return;
    this.hoveredGreenLine$.next(greenline);
  }

  setHoverBoardId(id?: string) {
    if (this.hoveredTopLevelElementId$.value === id) return;
    this.hoveredTopLevelElementId$.next(id);
  }

  setHighlightedElementId(id?: string) {
    if (this.currentHighlightedElementId$.value === id) return;
    this.currentHighlightedElementId$.next(id);
  }
}
