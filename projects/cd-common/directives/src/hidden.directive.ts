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

import { Directive, Input, ElementRef } from '@angular/core';

const DISPLAY_PROPERTY = 'display';
const HIDDEN_VALUE = 'none';

@Directive({
  selector: '[cdHidden]',
})
export class HiddenDirective {
  private _hidden = false;

  constructor(private _elementRef: ElementRef) {}

  get styleMap() {
    return this._elementRef.nativeElement.attributeStyleMap;
  }

  @Input()
  set cdHidden(hidden: boolean) {
    if (this._hidden === hidden) return;
    this._hidden = hidden;
    if (hidden) {
      this.styleMap.set(DISPLAY_PROPERTY, HIDDEN_VALUE);
    } else {
      this.styleMap.delete(DISPLAY_PROPERTY);
    }
  }
}
