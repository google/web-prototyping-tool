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

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { clamp } from 'cd-utils/numeric';

const generatePiePath = (largeArc: boolean, arcX: string, arcY: string) =>
  `M 0 -1
   A 1 1 0 ${largeArc ? 1 : 0} 1 ${arcX} ${arcY}
   L 0 0`;

@Component({
  selector: 'cd-progress-pie',
  templateUrl: './progress-pie.component.html',
  styleUrls: ['./progress-pie.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPieComponent {
  piePath = '';

  private _progress = 0;

  @Input()
  set progress(progress: number) {
    progress = clamp(progress, 0, 1);
    this._progress = progress;

    const radian = 2 * Math.PI * progress;

    const largeArc = progress >= 0.5;
    const arcX = Math.sin(radian).toFixed(2);
    const arcY = (-Math.cos(radian)).toFixed(2);

    this.piePath = generatePiePath(largeArc, arcX, arcY);
  }

  get progress() {
    return this._progress;
  }
}
