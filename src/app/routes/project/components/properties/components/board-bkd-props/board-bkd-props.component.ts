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

import { Component, EventEmitter, ChangeDetectionStrategy, Input, Output } from '@angular/core';
import * as cd from 'cd-interfaces';

// Fix for when a user removes a background before creating a symbol
const FALLBACK_BACKGROUND = { value: 'rgba(255,255,255,0' };

@Component({
  selector: 'app-board-bkd-props',
  templateUrl: './board-bkd-props.component.html',
  styleUrls: ['./board-bkd-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardBkdPropsComponent {
  @Input() assetsMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() model: cd.IStyleDeclaration = {};
  @Input() bkdSizeMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() designSystem?: cd.IDesignSystem;
  @Output() modelChange = new EventEmitter<cd.IStyleDeclaration>();
  @Output() action = new EventEmitter<cd.ISelectItem>();

  onBkdSizeChange(item: cd.SelectItemOutput) {
    const { value: backgroundSize } = item as cd.ISelectItem;
    this.modelChange.emit({ backgroundSize });
  }

  updateBackgroundImage(img: cd.IValue) {
    this.modelChange.emit({ backgroundImage: img });
  }

  get backgroundValue() {
    return this.model?.background?.[0] || FALLBACK_BACKGROUND;
  }

  onBackgroundImageChange(item: cd.SelectItemOutput) {
    const { action, id, type } = item as cd.ISelectItem;
    if (action) return this.action.emit(item as cd.ISelectItem);
    const isEmpty = type === cd.SelectItemType.Empty;
    const bkdImg = isEmpty ? { id: null, value: '' } : { id };
    this.updateBackgroundImage(bkdImg);
  }

  onBackgroundColorSelect(item: cd.SelectItemOutput) {
    const { id, value, action } = item as cd.ISelectItem;
    if (action) return this.action.emit(item as cd.ISelectItem);
    this.updateBackgroundColor({ id, value });
  }

  updateBackgroundColor(bkd: cd.IValue) {
    const background = [{ ...bkd }];
    this.modelChange.emit({ background });
  }

  onBackgroundColorChange(value: string) {
    this.updateBackgroundColor({ value });
  }
}
