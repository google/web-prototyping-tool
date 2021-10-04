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
import { ISelectItem, SelectItemType, TextAlign } from 'cd-interfaces';
import { styleFromWeight } from 'cd-common/utils';

@Component({
  selector: 'li[cd-select-item]',
  templateUrl: './select-item.component.html',
  styleUrls: ['./select-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectItemComponent {
  private _item!: ISelectItem;
  public fontWeight?: string;
  public fontStyle?: string;
  public fontFamily?: string;
  public isColor = false;
  public isIcon = false;
  public isCheck = false;
  public isImage = false;

  @Input() textAlign: TextAlign = TextAlign.Left;

  @Input()
  @HostBinding('class.selected')
  selected = false;

  @Input()
  @HostBinding('class.active')
  active = false;

  @HostBinding('class.disabled')
  get disabled(): boolean {
    return !!this.item.disabled;
  }

  @HostBinding('class.empty')
  get empty(): boolean {
    return this.item?.type === SelectItemType.Empty;
  }

  @HostBinding('class.divider')
  get divider() {
    return !!this.item.divider;
  }

  @HostBinding('class.show-left')
  get showLeft(): boolean {
    return this.isIcon || this.isCheck || this.isColor || this.isImage;
  }

  @Input()
  public set item(value: ISelectItem) {
    this._item = value;
    this.assignTypes(value);
  }
  public get item(): ISelectItem {
    return this._item;
  }

  assignFontWeight(value: string) {
    const { fontStyle, fontWeight } = styleFromWeight(value);
    this.fontStyle = fontStyle;
    this.fontWeight = fontWeight;
  }

  resetType() {
    this.isColor = false;
    this.isIcon = false;
    this.isCheck = false;
    this.isImage = false;
  }

  assignTypes(item: ISelectItem) {
    const { type, value } = item;
    this.resetType();
    if (item.icon) this.isIcon = true;
    if (item.color) this.isColor = true;
    switch (type) {
      case SelectItemType.FontWeight:
        this.assignFontWeight(value);
        break;
      case SelectItemType.FontFamily:
        this.fontFamily = this.item.title;
        break;
      case SelectItemType.Color:
        this.isColor = true;
        break;
      case SelectItemType.Icon:
        this.isIcon = true;
        break;
      case SelectItemType.Check:
        this.isCheck = true;
        break;
      case SelectItemType.Image:
        this.isImage = true;
        break;
    }
  }
}
