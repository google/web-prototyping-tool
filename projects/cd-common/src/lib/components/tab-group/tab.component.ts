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

import { Component, Input, ChangeDetectionStrategy, HostBinding } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Position } from 'cd-interfaces';

@Component({
  selector: 'cd-tab',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabComponent {
  private _active = false;
  private _disabled = false;

  @Input()
  set active(value: boolean) {
    this._active = value;
  }
  get active() {
    return this._active;
  }

  @Input()
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
  }
  get disabled() {
    return this._disabled;
  }

  @Input() label!: string;
  @Input() iconName?: string;
  @Input() tooltip?: string;
  @Input() tooltipDirection?: Position;

  @HostBinding('hidden')
  get isActive(): boolean {
    return this.active === false;
  }
}
