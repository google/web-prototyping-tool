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
  Output,
  EventEmitter,
  Input,
  AfterViewInit,
  OnDestroy,
  ContentChild,
} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChip, MatChipInput, MatChipInputEvent, MatChipList } from '@angular/material/chips';
import { Subscription } from 'rxjs';

export const CHIP_SEPARATOR_KEYS = [ENTER, COMMA];

/** For mat chips inside input chip list  */
@Directive({ selector: '[cdMatInputChip]' })
export class MatInputChipDirective implements AfterViewInit, OnDestroy {
  private _subscriptions = Subscription.EMPTY;

  @Input() index = -1;

  constructor(private _chipRef: MatChip, private _list: MatInputChipsDirective) {}

  ngAfterViewInit() {
    this._subscriptions = this._chipRef.removed.subscribe(this.onChipRemove);
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  onChipRemove = () => {
    this._list.onChipRemove(this.index);
  };
}

/** Manage actions for chips inside an input */
@Directive({ selector: '[cdMatInputChips]' })
export class MatInputChipsDirective implements AfterViewInit, OnDestroy {
  readonly separatorKeysCodes = CHIP_SEPARATOR_KEYS;
  private _subscriptions = Subscription.EMPTY;

  @Output() valueChange = new EventEmitter<string>();

  @ContentChild(MatChipInput, { read: MatChipInput }) _inputRef!: MatChipInput;

  constructor(private _chipsList: MatChipList) {}

  get chipValues(): string[] {
    return this._chipsList.chips.map((chip) => chip.value);
  }

  ngAfterViewInit(): void {
    this._inputRef.separatorKeyCodes = this.separatorKeysCodes;
    this._inputRef.addOnBlur = true;
    this._subscriptions = this._inputRef.chipEnd.subscribe(this.onChipAdd);
  }

  ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  onChipAdd = (event: MatChipInputEvent) => {
    const { chipValues } = this;
    const value = (event.value || '').trim();

    if (value) {
      chipValues.push(value);
    }
    event.input.value = '';

    this.updateChips(chipValues);
  };

  onChipRemove = (index: number) => {
    const { chipValues } = this;

    if (index >= 0) {
      chipValues.splice(index, 1);
    }
    this.updateChips(chipValues);
  };

  updateChips(values: string[]) {
    this.valueChange.emit(values.join(','));
  }
}
