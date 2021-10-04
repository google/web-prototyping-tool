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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { UnitTypes } from 'cd-metadata/units';
import * as cd from 'cd-interfaces';
import { isIcon } from 'cd-common/utils';
import { SIZE_LOOKUP } from 'cd-common/consts';

@Component({
  selector: 'cd-icon-props',
  templateUrl: './icon-props.component.html',
  styleUrls: ['./icon-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPropsComponent {
  private _designSystem!: cd.IDesignSystem;
  public fontFamilyMenuData: ReadonlyArray<cd.ISelectItem> = [];
  public iconSizeMenu: cd.ISelectItem[] = [
    // https://google.github.io/material-design-icons/
    { title: '18px', value: '18' },
    { title: '24px', value: '24' },
    { title: '36px', value: '36' },
    { title: '48px', value: '48' },
  ];

  @Input() size: cd.IValue = {};
  @Input() color: cd.IValue = {};
  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];

  @Output() valueChange = new EventEmitter<Partial<cd.IIconInputs>>();
  @Output() styleChange = new EventEmitter<cd.IStyleDeclaration>();
  @Output() action = new EventEmitter<cd.ISelectItem>();

  @Input() iconName?: cd.SelectedIcon = '';
  @Input() iconClass?: string;

  get designSystem() {
    return this._designSystem;
  }

  @Input() set designSystem(ds: cd.IDesignSystem) {
    this._designSystem = ds;
    this._generateIconsetMenu();
  }

  onIconNameChange(iconName: cd.SelectedIcon) {
    // If a cloud platform icon, set to specific size
    if (isIcon(iconName)) {
      const sizeValue = SIZE_LOOKUP[iconName.size];
      this.onSizeChange(sizeValue);
    }
    this.valueChange.emit({ iconName });
  }

  onSizeChange(val: string) {
    const value = Number(val);
    const units = UnitTypes.Pixels;
    const fontSize = { value, units };
    const width = fontSize;
    const height = fontSize;
    this.styleChange.emit({ fontSize, width, height });
  }

  updateColor(color: cd.IValue) {
    this.styleChange.emit({ color });
  }

  onColorChange(value: string) {
    this.updateColor({ value, id: null });
  }

  onColorSelect(item: cd.SelectItemOutput) {
    const { id, value, action } = item as cd.ISelectItem;
    if (action) return this.action.emit(item as cd.ISelectItem);
    this.updateColor({ value, id });
  }

  private _generateIconsetMenu() {
    const { icons } = this._designSystem;
    const currentFontFamilyValue = icons;
    const type = cd.SelectItemType.Default;

    this.fontFamilyMenuData = Object.values(icons).map((iconSet) => {
      const { name: title, fontId: value } = iconSet;
      const selected = value === currentFontFamilyValue;

      return { title, value, selected, divider: false, type };
    });
  }
}
