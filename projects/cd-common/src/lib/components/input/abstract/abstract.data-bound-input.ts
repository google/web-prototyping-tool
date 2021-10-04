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

import { Directive, Input, HostBinding, Output, EventEmitter } from '@angular/core';
import { areArraysEqual } from 'cd-utils/array';

/**
 * Ensures that that components such as Input & Rich Text Share
 * the same inputs used in the dynamic props component
 */
@Directive()
export class AbstractDataBoundInputDirective {
  private _activeElementIds: ReadonlyArray<string> = [];

  @Input()
  set activeElementIds(value: ReadonlyArray<string>) {
    const ids = value || [];
    if (areArraysEqual(ids, this._activeElementIds)) return;
    this._activeElementIds = ids;
    this.updateActiveElement();
  }
  get activeElementIds(): ReadonlyArray<string> {
    return this._activeElementIds;
  }

  @Input() bindable = false;

  /** highlight active element on the design surface */
  @Output() activeValue = new EventEmitter<string>();

  @HostBinding('class.bindable')
  get supportsDataBinding() {
    return this.bindable;
  }

  updateActiveElement() {}
}
