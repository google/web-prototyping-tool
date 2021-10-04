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
  EventEmitter,
  ChangeDetectionStrategy,
  Output,
  Input,
  HostBinding,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'cd-property-list-item',
  templateUrl: './property-list-item.component.html',
  styleUrls: ['./property-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyListItemComponent {
  private _hideLeft = false;
  private _noPadding = false;
  private _noBottom = false;

  @Input()
  set hideLeft(value: boolean | string) {
    this._hideLeft = coerceBooleanProperty(value);
  }

  @HostBinding('class.hide-left')
  get isHidden() {
    return this._hideLeft;
  }

  @Input()
  set noPadding(value: boolean | string) {
    this._noPadding = coerceBooleanProperty(value);
  }

  @Input()
  set noBottom(value: boolean | string) {
    this._noBottom = coerceBooleanProperty(value);
  }

  @HostBinding('class.no-padding')
  get hasNoPadding() {
    return this._noPadding;
  }

  @HostBinding('class.no-bottom')
  get hasNoBottom() {
    return this._noBottom;
  }

  @Output() delete = new EventEmitter<void>();

  onDeleteClick() {
    this.delete.emit();
  }
}
