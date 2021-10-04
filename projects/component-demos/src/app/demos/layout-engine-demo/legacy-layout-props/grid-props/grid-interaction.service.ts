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

@Injectable({
  providedIn: 'root',
})
export class GridInteractionService {
  $hover = new BehaviorSubject<number[]>([]);

  overRow(hoverIdx: number, rows: number = 0, cols: number = 0) {
    const total = (cols || 1) * rows;
    const hover = [];
    let currentRow = -1;

    for (let i = 0; i < total; i++) {
      const col = i % cols;
      if (col === 0) currentRow++;
      const active = currentRow === hoverIdx;
      hover.push(+active);
    }
    this.$hover.next(hover);
  }

  overColumn(hoverIdx: number, rows: number = 0, cols: number = 0) {
    const total = cols * (rows || 1);
    const hover = [];

    for (let i = 0; i < total; i++) {
      const col = i % cols;
      const active = col === hoverIdx;
      hover.push(+active);
    }
    this.$hover.next(hover);
  }

  out(_idx: number) {
    this.reset();
  }

  reset() {
    this.$hover.next([]);
  }
}
