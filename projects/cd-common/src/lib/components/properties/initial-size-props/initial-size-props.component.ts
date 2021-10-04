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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { IRect } from 'cd-interfaces';

type PartialRect = Partial<IRect>;

@Component({
  selector: 'cd-initial-size-props',
  templateUrl: './initial-size-props.component.html',
  styleUrls: ['./initial-size-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitialSizePropsComponent {
  @Input() minBoardSize = 0;
  @Input() maxBoardSize = 0;
  @Input() size?: PartialRect;
  @Input() disabled = false;

  @Output() sizeChange = new EventEmitter<PartialRect>();

  updateSize(rect: Partial<PartialRect>) {
    const frame: PartialRect = { ...this.size, ...rect };
    this.sizeChange.emit(frame);
  }

  onWidthChange(value: string | number) {
    const width = Number(value);
    this.updateSize({ width });
  }

  onHeightChange(value: string | number) {
    const height = Number(value);
    this.updateSize({ height });
  }
}
