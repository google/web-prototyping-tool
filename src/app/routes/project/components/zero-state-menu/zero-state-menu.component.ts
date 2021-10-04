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

import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { IPanelZeroStateItem } from './zero-state.interface';

@Component({
  selector: 'ul[app-zero-state-menu]',
  templateUrl: './zero-state-menu.component.html',
  styleUrls: ['./zero-state-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZeroStateMenuComponent {
  @Input() menuItems: IPanelZeroStateItem[] = [];
  @Input() moreIcon = '';
  @Input() moreLabel = 'More...';

  @Output() itemClick = new EventEmitter<IPanelZeroStateItem>();
  @Output() moreClick = new EventEmitter<void>();

  get showMore(): boolean {
    return !!this.moreIcon;
  }

  onMoreClick() {
    this.moreClick.emit();
  }

  onItemClick(item: IPanelZeroStateItem) {
    this.itemClick.emit(item);
  }
}
