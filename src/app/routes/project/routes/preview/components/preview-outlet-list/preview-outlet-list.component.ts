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

import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core';
import * as cd from 'cd-interfaces';

export interface IOutletListItem {
  id: string;
  name: string;
  type: cd.EntityType;
  elementType?: cd.ElementEntitySubType;
  commentCount: number;
}

@Component({
  selector: 'app-preview-outlet-list',
  templateUrl: './preview-outlet-list.component.html',
  styleUrls: ['./preview-outlet-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewOutletListComponent {
  @Input() activeOutletId?: string;
  @Input() homeBoardId?: string;
  @Input() navigateToBoard = false;
  @Input() outlets: ReadonlyArray<IOutletListItem> = [];
  @Output() paramChange = new EventEmitter<Partial<cd.IPreviewParams>>();
  @Output() shortcutClick = new EventEmitter<string>();

  emitParams(value: Partial<cd.IPreviewParams>) {
    this.paramChange.emit(value);
  }

  onOutletClick({ id }: IOutletListItem) {
    this.emitParams({ id });
  }

  onCommentClick(e: MouseEvent, { id }: IOutletListItem) {
    e.preventDefault();
    e.stopPropagation();
    this.emitParams({ id, comments: true, accessibility: false });
  }

  onShortcutClick(e: MouseEvent, { id }: IOutletListItem) {
    e.preventDefault();
    e.stopPropagation();
    this.shortcutClick.emit(id);
  }
}
