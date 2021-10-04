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
  EventEmitter,
  AfterViewInit,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  IGenericConfig,
  ISelectItem,
  IGenericListConfig,
  GenericListValueType,
} from 'cd-interfaces';
import { OverlayInitService } from '../../../overlay/overlay.init.service';
import { InputComponent } from '../../../input/input.component';

const enum LabelConfig {
  NameLabel = 'Name',
  ValueLabel = 'Value',
  Placeholder = 'Custom',
  IconLabel = 'Icon',
  DisabledLabel = 'Disabled',
}

@Component({
  selector: 'cd-generic-prop-editor',
  templateUrl: './generic-prop-editor.component.html',
  styleUrls: ['./generic-prop-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericPropEditorComponent implements AfterViewInit {
  private _data!: IGenericConfig;
  private _usedValues: string[] = [];
  public selectMenu: ISelectItem[] = [];
  public GenericListValueType = GenericListValueType;

  @Input() add = false;
  @Input() iconClass?: string;
  @Input() config!: IGenericListConfig;
  @Input() options: ISelectItem[] = [];

  @Input()
  public get data(): IGenericConfig {
    return this._data;
  }
  public set data(value: IGenericConfig) {
    this._data = value;
    this.buildSelectMenu();
  }
  @Input()
  // Maintain a list of currently selected menus
  public set usedValues(value: string[]) {
    this._usedValues = value;
  }

  @Output() dataChange = new EventEmitter<IGenericConfig>();
  @Output() addData = new EventEmitter<IGenericConfig>();

  @ViewChild('nameRef', { read: InputComponent }) nameRef!: InputComponent;

  constructor(private _overlayInit: OverlayInitService) {}

  get labelName(): string {
    return this.config?.nameLabel || LabelConfig.NameLabel;
  }

  get labelValue(): string {
    return this.config?.valueLabel || LabelConfig.ValueLabel;
  }

  get selectInputPlaceholder(): string {
    return this.config?.placeholder || LabelConfig.Placeholder;
  }

  get iconLabel(): string {
    return this.config?.iconLabel || LabelConfig.IconLabel;
  }

  get disabledLabel(): string {
    return this.config?.disabledLabel || LabelConfig.DisabledLabel;
  }

  buildSelectMenu() {
    if (this.config.valueType !== GenericListValueType.Select) return;
    const { options, _usedValues, data } = this;
    if (options.length === 0) return;
    const uniqueSelection = this.config.supportsUniqueSelection;
    this.selectMenu = options.reduce<ISelectItem[]>((acc, curr) => {
      const { title, value } = curr;
      const selected = value === data.value;
      const disabled = uniqueSelection && _usedValues.includes(value);
      acc.push({ title, value, selected, disabled });
      return acc;
    }, []);
  }

  onSelectMenu(item: ISelectItem) {
    const value = item.value;
    this.updateData({ value });
  }

  onNameChange(name: string) {
    this.updateData({ name });
  }

  onValueChange(value: string) {
    this.updateData({ value });
  }

  updateData(value: Partial<IGenericConfig>) {
    const update = { ...this.data, ...value };
    this.dataChange.emit(update);
    this.data = update;
  }

  onIconInputChange(icon: string) {
    this.updateData({ icon });
  }

  onDisabledChange(disabled: boolean) {
    this.updateData({ disabled });
  }

  selectAndFocusNameInput() {
    setTimeout(() => {
      const input = this.nameRef.inputRef.nativeElement;
      if (!input) return;
      input.focus();
      input.select();
    }, 100);
  }

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
    this.selectAndFocusNameInput();
  }

  onAdd() {
    this.addData.emit(this.data);
  }
}
