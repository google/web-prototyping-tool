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
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { OverlayInitService, InputComponent } from 'cd-common';
import * as cd from 'cd-interfaces';
import { UnitTypes } from 'cd-metadata/units';
import { roundToDecimal, toDecimal, toPercent } from 'cd-utils/numeric';

const variableTypeMenu: cd.ISelectItem[] = [
  { title: 'Size', value: cd.DesignVariableType.Size },
  { title: 'Layout', value: cd.DesignVariableType.Layout },
  { title: 'Opacity', value: cd.DesignVariableType.Opacity },
  { title: 'Shadow', value: cd.DesignVariableType.Shadow, disabled: true },
];

const variableUnitTypeMenu: cd.ISelectItem[] = [
  { title: 'None', value: UnitTypes.None },
  { title: 'Pixels', value: UnitTypes.Pixels },
  { title: 'Percent', value: UnitTypes.Percent },
];
@Component({
  selector: 'app-variable-editor',
  templateUrl: './variable-editor.component.html',
  styleUrls: ['./variable-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariableEditorComponent implements AfterViewInit {
  private _value!: cd.IDesignVariable;
  public variableTypeData: cd.ISelectItem[] = [];
  public unitTypeData: cd.ISelectItem[] = [];
  public DesignVariableType = cd.DesignVariableType;

  @Input() addVariable = false;
  @Input() removeVariable = false;
  @Input() designSystem?: cd.IDesignSystem;
  @Input()
  public set value(value: cd.IDesignVariable) {
    this._value = value;
    this.updateUnitTypeMenu(value);
    this.updateVariableTypeMenu(value);
  }
  public get value(): cd.IDesignVariable {
    return this._value;
  }

  @ViewChild('nameRef', { read: InputComponent }) nameRef!: InputComponent;

  @Output() valueChange = new EventEmitter<cd.IDesignVariable>();
  @Output() add = new EventEmitter<cd.IDesignVariable>();
  @Output() remove = new EventEmitter<string | null>();

  constructor(private _overlayInit: OverlayInitService) {}

  get rangeValue() {
    return Number(this.value?.value) * 100;
  }

  updateUnitTypeMenu(value: cd.IDesignVariable) {
    this.unitTypeData = variableUnitTypeMenu.map((item) => {
      const selected = value.units === item.value;
      return { ...item, selected };
    });
  }

  updateVariableTypeMenu(value: cd.IDesignVariable) {
    this.variableTypeData = variableTypeMenu.map((item) => {
      const selected = value.type === item.value;
      return { ...item, selected };
    });
  }

  focusOnNameInput() {
    setTimeout(() => {
      const input = this.nameRef.inputRef.nativeElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
    this.focusOnNameInput();
  }

  onNameChange(name: string) {
    this.onChange({ name });
  }

  convertToOpacityValue(opacity: number | string): number {
    const value = toDecimal(Number(opacity));
    return roundToDecimal(value, 2);
  }

  onOpacityChange(opacity: number) {
    const value = this.convertToOpacityValue(opacity);
    this.onChange({ value });
  }

  onValueChange(value: number | string) {
    this.onChange({ value });
  }

  onChange(value: Partial<cd.IDesignVariable>) {
    this.value = { ...this.value, ...value };
  }

  onCommitUpdate() {
    this.valueChange.emit(this.value);
  }

  onAddVariable() {
    // If name id is unique in the designSystem when - cased use that instead
    this.add.emit(this.value);
  }

  convertValueForType(
    value: string | number,
    type: cd.DesignVariableType,
    prevType: cd.DesignVariableType
  ): string | number {
    if (type === cd.DesignVariableType.Opacity) return this.convertToOpacityValue(value);
    if (prevType === cd.DesignVariableType.Opacity) return toPercent(Number(value));
    return value;
  }

  onVariableTypeChange(item: cd.ISelectItem) {
    const previousType = this.value.type;
    const type = item.value as cd.DesignVariableType;
    const noUnits = type === cd.DesignVariableType.Opacity || type === cd.DesignVariableType.Shadow;
    const units = noUnits ? '' : this.value.units || UnitTypes.Pixels;
    const value = this.convertValueForType(this.value.value, type, previousType);
    const update: Partial<cd.IDesignVariable> = { type, units, value };
    this.onChange(update);
  }

  onUnitSelect(item: cd.ISelectItem) {
    const units = item.value as cd.Units;
    this.onChange({ units });
  }

  onRemoveVariable() {
    this.remove.emit(this.value.id);
  }
}
