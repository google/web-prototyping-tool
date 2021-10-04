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
  Directive,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  EventEmitter,
  AfterContentInit,
} from '@angular/core';
import { ButtonVariant } from 'cd-interfaces';
import { ThemePalette } from '@angular/material/core';
import { MatButtonToggleGroup, MatButtonToggleChange } from '@angular/material/button-toggle';
import { Subscription } from 'rxjs';
import { MaterialThemeColors } from '../material-shared';
import { areObjectsEqual } from 'cd-utils/object';

/** Wrapper to manage Material ButtonToggleGroup */
@Directive({ selector: '[cdMatToggleButtonGroup]' })
export class ToggleButtonGroupDirective implements AfterContentInit, OnDestroy {
  private _subscriptions = Subscription.EMPTY;
  private _multiple = false;
  private _prevValue?: string | string[];
  private _value?: string | string[];

  @Input()
  variant: ButtonVariant = ButtonVariant.Basic;

  @Input()
  set multiple(multiple: boolean) {
    if (this._multiple === multiple) return;
    // hack to reset the internal selectionModel
    // https://github.com/angular/components/blob/16d1f9ee14bf3942d4fffea1c05470c13535a31f/src/material/button-toggle/button-toggle.ts#L231
    this.buttonGroup.ngOnInit();
    this._multiple = multiple;

    // transform the group value if needed
    this.adjustButtonGroupValue(multiple, this._value);
  }
  get multiple(): boolean {
    return this._multiple;
  }

  @Input()
  set groupValue(value: string | string[]) {
    if (areObjectsEqual(value, this._value)) return;

    this._prevValue = this._value;
    this._value = value;
    this.adjustButtonGroupValue(this.multiple, value);
  }

  @Input()
  color?: ThemePalette;

  @HostBinding('class.cd-basic-toggle-button-group')
  get isBasic() {
    return this.variant === ButtonVariant.Basic;
  }

  @HostBinding('class.cd-button-toggle-primary')
  get isPrimary() {
    return this.color === MaterialThemeColors.Primary;
  }

  @HostBinding('class.cd-button-toggle-secondary')
  get isSecondary() {
    return this.color === MaterialThemeColors.Secondary;
  }

  @HostBinding('class.cd-button-toggle-warn')
  get isWarn() {
    return this.color === MaterialThemeColors.Warn;
  }

  @Output() buttonSelected = new EventEmitter<string>();
  @Output() buttonUnselected = new EventEmitter<string>();

  constructor(private buttonGroup: MatButtonToggleGroup) {}

  ngAfterContentInit() {
    this._subscriptions = this.buttonGroup.change.subscribe(this.onChange);
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  /**
   * Emits custom events to signal which button changed + selected change type
   */
  onChange = (change: MatButtonToggleChange) => {
    const { value: newGroupValue } = change;

    if (this.multiple) {
      const oldGroupValue = this._prevValue as string[];
      const isNewSelection = newGroupValue.length > oldGroupValue.length;
      const updatedValue = this.findChangedValueInArray(oldGroupValue, newGroupValue);
      this.emitButtonSelect(isNewSelection, updatedValue);
    } else {
      // If in single select mode, emit unselected for previously selected button,
      // and emit selected for newly selected button
      const oldGroupValue = this._prevValue as string;
      this.buttonUnselected.emit(oldGroupValue);
      this.buttonSelected.emit(newGroupValue);
    }

    this._value = newGroupValue;
  };

  emitButtonSelect(selected: boolean, value?: string) {
    return selected ? this.buttonSelected.emit(value) : this.buttonUnselected.emit(value);
  }

  /** Find either the newly added or removed value between two button arrays */
  findChangedValueInArray(arr1: string[], arr2: string[]): string | undefined {
    const longerArr = arr1.length > arr2.length ? arr1 : arr2;
    const shorterArr = arr1.length > arr2.length ? arr2 : arr1;

    for (const val of longerArr) {
      if (!shorterArr.includes(val)) return val;
    }
    return undefined;
  }

  /**
   * Make sure the internal group value formatting is always correct based on multiple attr,
   * so the Material component doesn't throw errors if they mismatch.
   * This guarantees proper formatting since the timing of inputs is not predictable.
   */
  adjustButtonGroupValue(multiple: boolean, value?: string | string[]) {
    const valueIsArray = Array.isArray(value);
    const singleValue = !valueIsArray ? value : value?.length ? value[0] : '';
    const multiValue = valueIsArray ? value : value ? [value as string] : [];
    const adjustedValue = multiple ? multiValue : singleValue;
    this.buttonGroup.value = adjustedValue;
  }
}
