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
  ChangeDetectionStrategy,
  Input,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { IMenuListItem } from 'cd-interfaces';

@Component({
  selector: 'cd-menu-list',
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuListComponent implements OnInit {
  @Input() items?: IMenuListItem[];
  @Input() selectedId = '';

  @Output() selectedIdChange: EventEmitter<string> = new EventEmitter<string>();

  ngOnInit(): void {
    if (!this.selectedId && this.items && this.items.length) {
      this.selectedId = this.items[0].id;
    }
  }

  onMenuListItemClicked(id: string) {
    this.selectedIdChange.emit(id);
  }
}
