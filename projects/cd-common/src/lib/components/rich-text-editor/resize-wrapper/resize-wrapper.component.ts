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

import { AUTO_VALUE } from 'cd-common/consts';
import { Component, HostBinding, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'cd-resize-wrapper',
  templateUrl: './resize-wrapper.component.html',
  styleUrls: ['./resize-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizeWrapperComponent {
  @Input()
  @HostBinding('class.focused')
  focused?: boolean;

  @Input()
  @HostBinding('style.height.px')
  height = AUTO_VALUE;

  @Input()
  @HostBinding('class.dragging')
  dragging = false;

  onResize(size: number) {
    this.height = String(size);
  }

  onResizeStart() {
    this.dragging = true;
  }

  onResizeEnd() {
    this.dragging = false;
  }
}
