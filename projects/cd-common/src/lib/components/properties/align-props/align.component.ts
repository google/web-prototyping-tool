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

import { ISelectItem } from 'cd-interfaces';
import { LayoutAlignment } from 'cd-common/consts';
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'cd-align-prop',
  templateUrl: './align.component.html',
  styleUrls: ['./align.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlignComponent {
  private _value: LayoutAlignment = LayoutAlignment.TopLeft;
  public menu: ISelectItem[] = Object.values(LayoutAlignment).map((value) => {
    return { title: value, value };
  });

  @Input() label = 'Align';
  @Input()
  set value(value: LayoutAlignment) {
    this._value = value || LayoutAlignment.TopLeft;
  }
  get value(): LayoutAlignment {
    return this._value;
  }

  @Output() valueChange = new EventEmitter<LayoutAlignment>();

  onMenuChange(item: ISelectItem) {
    const align = item.value as LayoutAlignment;
    this.value = align;
    this.valueChange.emit(align);
  }
}
