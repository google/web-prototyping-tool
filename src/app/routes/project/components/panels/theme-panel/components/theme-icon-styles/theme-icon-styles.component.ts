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

import * as cd from 'cd-interfaces';
import {
  IconStyle,
  ORDERED_ICON_STYLES,
  ICON_STYLE_CLASSES,
  ICON_FONT_FAMILY_CLASS_MAP,
  ICON_FONT_FAMILY_STYLE_MAP,
  MATERIAL_ICONS,
} from 'cd-themes';

@Component({
  selector: 'app-theme-icon-styles',
  templateUrl: './theme-icon-styles.component.html',
  styleUrls: ['./theme-icon-styles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeIconStylesComponent {
  private _fontFamily: cd.IFontFamily = MATERIAL_ICONS;
  private _selectedStyle: IconStyle = IconStyle.MATERIAL_ICONS_FILLED;
  public orderedIconStyles = ORDERED_ICON_STYLES;
  public iconStyleClasses = ICON_STYLE_CLASSES;
  public iconFontFamilyClassMap = ICON_FONT_FAMILY_CLASS_MAP;
  public previewIcons = ['invert_colors', 'face', 'android', 'print', 'fastfood'];
  public iconStyleNames = [
    {
      icon: '/assets/design-system/icon-styles/google-material.svg',
      label: 'Google Material',
    },
    {
      icon: '/assets/design-system/icon-styles/filled.svg',
      label: 'Material Standard',
    },
    {
      icon: '/assets/design-system/icon-styles/outlined.svg',
      label: 'Material Outlined',
    },
    {
      icon: '/assets/design-system/icon-styles/round.svg',
      label: 'Material Round',
    },
    {
      icon: '/assets/design-system/icon-styles/sharp.svg',
      label: 'Material Sharp',
    },
  ];

  @Output() selectStyle = new EventEmitter<IconStyle>();

  get fontFamily(): cd.IFontFamily {
    return this._fontFamily;
  }

  set fontFamily(family: cd.IFontFamily) {
    this._fontFamily = family;
  }

  @Input()
  set designSystem(ds: cd.IDesignSystem | undefined) {
    if (ds && ds.icons) {
      this.fontFamily = ds.icons;
      const { family } = this.fontFamily;
      this.selectedStyle = ICON_FONT_FAMILY_STYLE_MAP[family];
    }
  }

  get selectedStyle(): IconStyle {
    return this._selectedStyle;
  }

  set selectedStyle(style: IconStyle) {
    this._selectedStyle = style;
  }

  onClick(style: IconStyle) {
    this.selectStyle.emit(style);
  }
}
