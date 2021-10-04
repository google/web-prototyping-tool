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
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { deepCopy, areObjectsEqual } from 'cd-utils/object';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { FontKind, FontWeight, reverseFontWeightMap } from 'cd-metadata/fonts';
import { roundToDecimal } from 'cd-utils/numeric';
import { InputComponent } from '../../input/input.component';
import { NORMAL_VALUE } from 'cd-common/consts';
import { TextType, sortDesignSystemValues, ROBOTO_FONT, ColorType } from 'cd-themes';
import * as cd from 'cd-interfaces';

type FontMapType = cd.IStringMap<cd.IFontFamily>;
type TypographyMapType = cd.IStringMap<cd.ITypographyStyle>;

const DEFAULT_FONT_CONFIG: cd.ITypographyStyle = {
  name: '',
  size: 12,
  fontId: ROBOTO_FONT,
  weight: FontWeight.Regular,
  color: {
    id: ColorType.Text,
    value: '#000',
  },
};

@Component({
  selector: 'cd-font-props',
  templateUrl: './font-props.component.html',
  styleUrls: ['./font-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FontPropertiesComponent implements AfterViewInit {
  private _value = DEFAULT_FONT_CONFIG;
  private _designSystem!: cd.IDesignSystem;
  private _editable = false;

  @Input() colorMenuData: ReadonlyArray<cd.ISelectItem> = [];
  @Input() fontStyleMenuData: cd.ISelectItem[] = [];
  @Input() fontMenuData: cd.ISelectItem[] = [];
  @Input() weightMenuData: cd.ISelectItem[] = [];

  @Output() valueChange = new EventEmitter<cd.ITypographyStyle>();
  @Output() action = new EventEmitter<cd.ISelectItem>();

  @ViewChild('titleInputRef', { read: InputComponent })
  titleInputRef!: InputComponent;

  @Input() set designSystem(value: cd.IDesignSystem) {
    this._designSystem = value;
    if (this._editable) {
      this.buildMenus();
    } else {
      this.updateValueFromDesignSystem();
    }
    this.generateFontStyleMenu(value.typography);
    this.generateFontListMenu(value.fonts);
  }
  get designSystem() {
    return this._designSystem;
  }

  @Input()
  set editable(value) {
    this._editable = coerceBooleanProperty(value);
  }
  get editable() {
    return this._editable;
  }

  @Input()
  set value(value: cd.ITypographyStyle | undefined) {
    if (areObjectsEqual(value, this._value) === true) return;
    const dsValue = this.valueFromDesignSystem(value);
    this._value = dsValue || DEFAULT_FONT_CONFIG;
    this.buildMenus();
  }

  get value() {
    return this._value;
  }

  constructor(private _cdRef: ChangeDetectorRef) {}

  updateValueFromDesignSystem() {
    this.value = this.valueFromDesignSystem(this._value);
    this.buildMenus();
  }

  private valueFromDesignSystem(value?: cd.ITypographyStyle): cd.ITypographyStyle | undefined {
    const { _designSystem } = this;
    if (!value) return;
    if (!value.id || !_designSystem) return value;
    const { id } = value;
    const ref = id && _designSystem.typography[id];
    if (ref) {
      const clone: cd.ITypographyStyle = deepCopy(ref);
      return { ...clone, id };
    }
    console.warn('Cannot find design system reference');
    return value;
  }

  private buildMenus() {
    const { _designSystem, _value } = this;
    if (!_designSystem) return;
    this.generateFontWeightMenu(_designSystem.fonts, _value);
    this._cdRef.markForCheck();
  }

  private generateFontStyleMenu(typography: TypographyMapType) {
    const entries = Object.entries(typography);

    this.fontStyleMenuData = entries
      .map(([id, value]) => ({ ...value, id }))
      .sort(sortDesignSystemValues)
      .filter((item) => item.id !== TextType.IconFontFamily)
      .map((item) => {
        const { name: title, id: value } = item;
        return { title, value };
      });
  }

  /**
   * Move system fonts to the bottom and sort alphabetically
   */
  private sortDesignSystemFontsLast = (
    a: [string, cd.IFontFamily],
    b: [string, cd.IFontFamily]
  ): number => {
    const [, bValue] = b;
    const [, aValue] = a;
    const { kind: bKind = FontKind.Default } = bValue;
    const { kind: aKind = FontKind.Default } = aValue;
    const bMatch = bKind === FontKind.System;
    const aMatch = aKind === FontKind.System;
    const compare = aValue.family.localeCompare(bValue.family);
    if (aMatch && bMatch) return compare;
    if (aMatch && !bMatch) return 1;
    if (bMatch) return -1;
    return compare;
  };

  private generateFontListMenu(fonts: FontMapType) {
    const type = cd.SelectItemType.FontFamily;
    this.fontMenuData = Object.entries(fonts)
      .sort(this.sortDesignSystemFontsLast)
      .filter(([, font]) => {
        const { kind = FontKind.Default } = font;
        return kind !== FontKind.Icon;
      })
      .map(([value, item], index, arr) => {
        const { family: title } = item;
        // Find where system fonts start and add a divider
        const next = arr[index + 1];
        const divider = next && next[1].kind !== item.kind;
        return { title, value, divider, type };
      });
  }

  /**
   * Google font varaiants come in the following format:
   * ['300', 'Regular', '500',' 500italic']
   * This method removes italic variants and renames 'Regular' to 400
   * @param font
   */
  private filterVariants(font: cd.IFontFamily): string[] {
    const Weight400 = FontWeight.Regular;
    const reverseWeightMap = reverseFontWeightMap();
    return font.variants.map((item: string) => {
      const value = item === reverseWeightMap[Weight400].toLowerCase() ? Weight400 : item;
      return reverseWeightMap[value];
    });
  }

  private buildFontWeightData(activeFont?: cd.IFontFamily) {
    const reverseWeightMap = reverseFontWeightMap();
    const Weight400 = FontWeight.Regular;
    const type = cd.SelectItemType.FontWeight;
    if (!activeFont) return [{ title: reverseWeightMap[Weight400], value: Weight400, type }];
    const filtered = this.filterVariants(activeFont);
    return filtered.map((title: string) => {
      const value = reverseWeightMap[title];
      return { title, value, type };
    });
  }

  private generateFontWeightMenu(fonts: FontMapType, currentValue: cd.ITypographyStyle) {
    const fontId = currentValue?.fontId;
    const activeFont = (fontId && fonts?.[fontId]) || undefined;
    this.weightMenuData = this.buildFontWeightData(activeFont);
  }

  private updateValue(props: Partial<cd.ITypographyStyle>, removeId = true) {
    const useReference = this._editable === false && removeId;
    const currentValue = useReference ? this.valueFromDesignSystem(this._value) : this.value;
    const value = deepCopy(currentValue) as cd.ITypographyStyle;
    const resetValues = removeId ? { lineHeight: NORMAL_VALUE, letterSpacing: 0 } : {};
    const mergedProps = { ...resetValues, ...value, ...props } as cd.ITypographyStyle;
    if (removeId && !this._editable) {
      mergedProps.id = null;
    }

    this.valueChange.emit(mergedProps);
    this._value = mergedProps;
    this.buildMenus();
    this._cdRef.detectChanges();
  }

  onColorSelect(item: cd.SelectItemOutput) {
    const { id, value, action } = item as cd.ISelectItem;
    if (action) {
      this.action.emit(item as cd.ISelectItem);
    } else {
      const update = { color: { id, value } };
      this.updateValue(update);
    }
  }

  onColorChange(value: string) {
    const update = { color: { id: null, value } };
    this.updateValue(update);
  }

  onCharChange(value: string) {
    const update = { letterSpacing: Number(value) };
    this.updateValue(update);
  }

  onLineChange(value: string) {
    const valueNum = Number(value);
    const lineHeight = valueNum === 0 ? NORMAL_VALUE : valueNum;
    this.updateValue({ lineHeight });
  }

  onWeightChange(item: cd.SelectItemOutput) {
    const { value } = item as cd.ISelectItem;
    const weight = String(value) as FontWeight;
    this.updateValue({ weight });
  }

  onFontStyleChange(item: cd.SelectItemOutput) {
    const { value } = item as cd.ISelectItem;
    const ref = this.designSystem.typography[value];
    if (ref) {
      const update = { ...ref, id: value };
      this.updateValue(update, false);
    } else {
      throw new Error('Missing reference to design system');
    }
  }

  fontSupportsCurrentWeight(fontId: string, currentWeight: string | undefined): boolean {
    const font = this._designSystem.fonts[fontId];
    if (!currentWeight || !font) return false;
    const reverseWeightMap = reverseFontWeightMap();
    return this.filterVariants(font).some((item: any) => {
      const check = reverseWeightMap[item];
      return check === currentWeight;
    });
  }

  onFontChange(item: cd.SelectItemOutput) {
    const { value } = item as cd.ISelectItem;
    const update: Partial<cd.ITypographyStyle> = { fontId: value };

    const { weight } = this._value;
    if (this.fontSupportsCurrentWeight(value, weight) === false) {
      // If the selected font doesn't support the previous weight, reset the weight to 400 / Regular
      update.weight = FontWeight.Regular;
    }

    this.updateValue(update);
  }

  onTitleChange(name: string) {
    this.updateValue({ name });
  }

  onSizeChange(value: string) {
    const { lineHeight, size } = this._value;
    const sizeValue = Number(value);
    const update: Partial<cd.ITypographyStyle> = { size: sizeValue };

    if (lineHeight && lineHeight !== NORMAL_VALUE) {
      const converted = (lineHeight * sizeValue) / size;
      update.lineHeight = roundToDecimal(converted, 1);
    }

    this.updateValue(update);
  }

  ngAfterViewInit(): void {
    if (!this._editable) return;
    // TODO cleanup
    setTimeout(() => {
      const input = this.titleInputRef.inputRef.nativeElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }
}
