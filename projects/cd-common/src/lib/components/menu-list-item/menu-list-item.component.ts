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

@Component({
  selector: 'cd-menu-list-item',
  templateUrl: './menu-list-item.component.html',
  styleUrls: ['./menu-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuListItemComponent {
  @Input() name?: string;
  @Input() count?: number;
  @Input() selected = false;

  @HostBinding('class.selected')
  get getSelected(): boolean {
    return this.selected;
  }
}
