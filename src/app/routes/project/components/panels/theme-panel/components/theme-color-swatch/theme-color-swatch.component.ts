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
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  HostListener,
} from '@angular/core';
import { menuConfig, MenuChoice } from './theme-color-swatch.config';
import { IMenuConfig } from 'cd-interfaces';
import { IDesignColorWithId } from '../theme-color/theme-color.utils';
import { keyCheck, KEYS } from 'cd-utils/keycodes';
import { deepCopy } from 'cd-utils/object';
import { InputComponent } from 'cd-common';

const MINIMUM_NAME_LENGTH = 0;
const SPACES_REGEX = /\s/g;

@Component({
  selector: 'app-theme-color-swatch',
  templateUrl: './theme-color-swatch.component.html',
  styleUrls: ['./theme-color-swatch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeColorSwatchComponent {
  public newThemeColorName = '';
  public editingName = false;
  public contextMenuData = menuConfig;

  @Input() alpha = 1;
  @Input() editing = false;
  @Input() themeColor: IDesignColorWithId | null = null;

  @ViewChild('inputCompRef', { read: InputComponent })
  _inputCompRef!: InputComponent;

  @Output() nameChanged = new EventEmitter<IDesignColorWithId>();
  @Output() editSwatchIdChanged = new EventEmitter<MouseEvent | KeyboardEvent>();
  @Output() removeSwatch = new EventEmitter<string>();

  constructor(private _cdRef: ChangeDetectorRef) {}

  get nativeInput(): HTMLInputElement {
    return this._inputCompRef.inputRef.nativeElement;
  }

  @HostListener('dblclick')
  onItemDoubleClick() {
    this.renameColor();
  }

  onLabelSectionKeydown({ key }: KeyboardEvent) {
    // Need to check for theme color here
    // in case of Escape key.
    if (!this.themeColor) return;
    if (!keyCheck(key, KEYS.Enter, KEYS.Escape) && key !== KEYS.Enter && key !== KEYS.Escape) {
      return;
    }

    if (this.editingName) {
      if (key === KEYS.Escape || !this.newThemeColorName.replace(SPACES_REGEX, '').length) {
        this.newThemeColorName = this.themeColor.name;
      }

      this.nativeInput.blur();
    }
  }

  onMenuSelect({ id }: IMenuConfig) {
    if (!this.themeColor) return;
    if (id === MenuChoice.Rename) return this.renameColor();
    if (id === MenuChoice.Delete) return this.removeColor();
  }

  onInputBlur(focused: boolean) {
    if (focused) return;
    if (!this.themeColor) return;

    if (
      this.newThemeColorName.length > MINIMUM_NAME_LENGTH &&
      this.themeColor.name !== this.newThemeColorName
    ) {
      const newThemeColor = deepCopy(this.themeColor);
      newThemeColor.name = this.newThemeColorName;
      this.nameChanged.emit(newThemeColor);
    }

    this.editingName = false;
    this._cdRef.detectChanges();
  }

  onInputClick(event: MouseEvent) {
    event.stopPropagation();
  }

  onSwatchClick(e: MouseEvent | KeyboardEvent) {
    const { themeColor } = this;
    if (!themeColor) return;
    this.editSwatchIdChanged.emit(e);
    e.stopPropagation();
  }

  // Must detect changes so input is focused before .select() is called. Alternately we
  // could wrap .select() in a setTimeout().
  private editLabel() {
    if (!this.themeColor) return;

    this.editingName = true;
    this._cdRef.detectChanges();
    this.newThemeColorName = this.themeColor.name;

    const { nativeInput } = this;
    nativeInput.focus();
    this._cdRef.detectChanges();
    nativeInput.select();
  }

  private removeColor() {
    if (!this.themeColor) return;
    this.removeSwatch.emit(this.themeColor.id);
  }

  private renameColor() {
    this.editLabel();
  }

  onInputChange(value: string) {
    this.newThemeColorName = value;
  }
}
