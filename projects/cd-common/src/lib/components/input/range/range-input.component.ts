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
  ChangeDetectorRef,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { InputCollectionDirective } from '../abstract/abstract.input.collection';
import { InputType, ISelectItem } from 'cd-interfaces';
import { isObject } from 'cd-utils/object';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'cd-range-input',
  templateUrl: './range-input.component.html',
  styleUrls: ['./range-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeInputComponent extends InputCollectionDirective {
  private _resetNumberOnDelete = false;
  @Input() type?: InputType;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step = 1;
  @Input() value = 0;
  @Input() innerLabel?: string;
  @Input() placeholder?: string;
  @Input() autocompleteMenu: ISelectItem[] = [];

  /** When deleting a number should it be undefined or zero */
  @Input()
  set resetNumberOnDelete(value: string | boolean) {
    this._resetNumberOnDelete = coerceBooleanProperty(value);
  }
  get resetNumberOnDelete() {
    return this._resetNumberOnDelete;
  }

  constructor(protected _cdRef: ChangeDetectorRef, protected _elemRef: ElementRef) {
    super(_elemRef);
  }

  writeValue(item: ISelectItem | number) {
    const value = isObject(item) ? Number((item as ISelectItem).value) : item;
    this.valueChange.emit(value);
  }
}
