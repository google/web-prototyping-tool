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

import { Directive, Input, HostBinding } from '@angular/core';
import { EDGE } from 'cd-utils/geometry';

@Directive({
  selector: '[appResizeEdge]',
})
export class ResizeEdgeDirective {
  @Input('appResizeEdge') edge?: EDGE;

  @HostBinding('class.top')
  get top() {
    return this.edge === EDGE.Top;
  }

  @HostBinding('class.top-left')
  get topLeft() {
    return this.edge === EDGE.TopLeft;
  }

  @HostBinding('class.top-right')
  get topRight() {
    return this.edge === EDGE.TopRight;
  }

  @HostBinding('class.left')
  get left() {
    return this.edge === EDGE.Left;
  }

  @HostBinding('class.bottom')
  get bottom() {
    return this.edge === EDGE.Bottom;
  }

  @HostBinding('class.bottom-left')
  get bottomLeft() {
    return this.edge === EDGE.BottomLeft;
  }

  @HostBinding('class.right')
  get right() {
    return this.edge === EDGE.Right;
  }

  @HostBinding('class.bottom-right')
  get bottomRight() {
    return this.edge === EDGE.BottomRight;
  }
}
