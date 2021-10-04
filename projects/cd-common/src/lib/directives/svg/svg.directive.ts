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
import * as cd from 'cd-interfaces';

@Directive({
  selector: '[cdSVGRect]',
})
export class RectDirective {
  private _x = 0;
  private _y = 0;
  private _width = 0;
  private _height = 0;
  private _scale = 1;

  @HostBinding('attr.width') width = 0;
  @HostBinding('attr.height') height = 0;
  @HostBinding('attr.x') x = 0;
  @HostBinding('attr.y') y = 0;

  @Input('cdSVGRect')
  set rect(value: cd.IRect) {
    if (!value) return;
    this._width = value.width;
    this._height = value.height;
    this._x = value.x;
    this._y = value.y;
    this.updateValues();
  }

  @Input()
  set scale(value: number) {
    this._scale = value;
    this.updateValues();
  }

  private updateValues() {
    const { _scale, _width, _height, _x, _y } = this;
    this.width = _width * _scale;
    this.height = _height * _scale;
    this.x = _x * _scale;
    this.y = _y * _scale;
  }
}

@Directive({
  selector: '[cdSVGLine]',
})
export class LineDirective {
  @Input('cdSVGLine')
  public set line(value: cd.ILine) {
    if (!value) return;
    this.x1 = value.x1;
    this.y1 = value.y1;
    this.x2 = value.x2;
    this.y2 = value.y2;
  }

  @HostBinding('attr.x1') x1 = 0;
  @HostBinding('attr.y1') y1 = 0;
  @HostBinding('attr.x2') x2 = 0;
  @HostBinding('attr.y2') y2 = 0;
}
