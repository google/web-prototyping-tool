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
  Input,
  Output,
  EventEmitter,
  HostBinding,
  ChangeDetectionStrategy,
} from '@angular/core';

const DEFAULT_BORDER_RADIUS = 2;

@Component({
  selector: 'cd-swatch',
  templateUrl: './swatch.component.html',
  styleUrls: ['./swatch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwatchComponent {
  @Input() size?: number;
  @Input() color?: string;

  @HostBinding('class.grid')
  get alphaGrid() {
    return !!this.color;
  }

  @Output() swatchClick = new EventEmitter<string>();

  @Input()
  @HostBinding('style.borderRadius.px')
  borderRadius = DEFAULT_BORDER_RADIUS;

  @Input()
  @HostBinding('style.width.px')
  get width() {
    return this.size;
  }

  @Input()
  @HostBinding('style.height.px')
  get height() {
    return this.size;
  }

  public onSwatchClick() {
    this.swatchClick.emit(this.color);
  }
}
