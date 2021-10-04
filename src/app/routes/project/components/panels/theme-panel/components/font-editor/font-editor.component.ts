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
  AfterViewInit,
} from '@angular/core';
import { ITypographyStyle, IDesignSystem, ISelectItem, SelectItemType } from 'cd-interfaces';
import { menuFromDesignSystemAttributes } from 'cd-common/utils';
import { OverlayInitService } from 'cd-common';

@Component({
  selector: 'app-font-editor',
  templateUrl: './font-editor.component.html',
  styleUrls: ['./font-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FontEditorComponent implements AfterViewInit {
  private _value!: ITypographyStyle;
  private _designSystem?: IDesignSystem;
  public colorMenuData: ReadonlyArray<ISelectItem> = [];
  @Input() addStyle = false;
  @Input() removeStyle = false;
  @Input()
  public set designSystem(value: IDesignSystem | undefined) {
    this._designSystem = value;
    if (!value) return;
    this.generateColorMenu(value);
  }

  public get designSystem(): IDesignSystem | undefined {
    return this._designSystem;
  }

  @Input()
  public set value(value: ITypographyStyle) {
    this._value = value;
  }
  public get value(): ITypographyStyle {
    return this._value;
  }

  @Output() valueChange = new EventEmitter<ITypographyStyle>();
  @Output() add = new EventEmitter<ITypographyStyle>();
  @Output() remove = new EventEmitter<string | null>();

  constructor(private _overlayInit: OverlayInitService) {}

  generateColorMenu(designSystem: IDesignSystem) {
    this.colorMenuData = menuFromDesignSystemAttributes(designSystem.colors, SelectItemType.Color);
  }

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
  }

  onValueChange(value: ITypographyStyle) {
    this.value = value;
  }

  onCommitUpdate() {
    this.valueChange.emit(this.value);
  }

  applyValueToDesignSystem(ds: IDesignSystem, value: ITypographyStyle) {
    const id = value.id;
    if (id) ds.typography[id] = value;
  }

  onAddTypeStyle() {
    this.add.emit(this.value);
  }

  onRemoveStyle() {
    this.remove.emit(this.value.id);
  }
}
