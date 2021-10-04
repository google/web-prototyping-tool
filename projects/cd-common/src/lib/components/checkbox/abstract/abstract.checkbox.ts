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

import { Input, HostBinding, Output, EventEmitter, Directive } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Directive()
export abstract class AbstractCheckboxDirective {
  protected _checked = false;
  protected _focused = false;
  private _preventUncheck = false;
  @Output() readonly change = new EventEmitter<boolean>();

  @HostBinding('class.checked')
  get active() {
    return this._checked;
  }

  @Input()
  public set preventUncheck(value) {
    this._preventUncheck = coerceBooleanProperty(value);
  }
  public get preventUncheck() {
    return this._preventUncheck;
  }

  @Input()
  set checked(value: boolean) {
    this._checked = coerceBooleanProperty(value);
  }
  get checked(): boolean {
    return this._checked;
  }

  @HostBinding('class.disabled')
  @Input()
  disabled = false;

  onCheckboxChange(e: Event) {
    e.stopPropagation();
    if (this._checked && this._preventUncheck) {
      return;
    }
    this._checked = !this._checked;
    this.change.emit(this._checked);
  }

  onFocus() {
    this._focused = true;
  }

  onBlur() {
    this._focused = false;
  }

  get focused() {
    return this._focused;
  }
}
