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

import { Component, ChangeDetectionStrategy, Input, HostBinding } from '@angular/core';
import { parseShortcut } from 'cd-utils/keycodes';
import { ComponentSize, IMenuConfig } from 'cd-interfaces';

@Component({
  selector: 'li[cd-menu-item]',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemComponent {
  private _value!: IMenuConfig;
  public shortcut?: string;
  public divider = false;

  @HostBinding('class.indent') indent = false;

  @Input()
  set value(value) {
    this._value = value;
    const canShowCheckbox = value.checked !== undefined;
    this.indent = canShowCheckbox && (!!value.icon || !!value.color);
    this.disabled = !!value.disabled;
    this.divider = !!value.divider;
    this.shortcut = value.shortcut ? parseShortcut(value.shortcut) : '';
  }
  get value() {
    return this._value;
  }

  @Input() size: ComponentSize = ComponentSize.Medium;

  get iconSize() {
    return this.size === ComponentSize.Large ? ComponentSize.Medium : ComponentSize.Small;
  }

  @HostBinding('class.large')
  get isLarge() {
    return this.size === ComponentSize.Large;
  }

  @Input()
  @HostBinding('class.hover')
  hover?: boolean;

  @HostBinding('class.disabled') disabled = false;
}
