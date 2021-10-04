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

import { EventEmitter, Output, Input, ElementRef, Directive } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { clamp, half } from 'cd-utils/numeric';
import { ISelectItem } from 'cd-interfaces';

const PADDING = 20;
const OVERLAY_WIDTH = 220;
const OVERLAY_HEIGHT = 336;

@Directive()
export abstract class InputCollectionDirective {
  private _showBottomLabel = false;
  protected _value: any;

  @Input() abstract value: any;
  @Input() units?: string;
  @Output() valueChange = new EventEmitter<any>();
  @Output() action = new EventEmitter<ISelectItem>();

  @Input()
  set showBottomLabel(value: boolean) {
    this._showBottomLabel = coerceBooleanProperty(value);
  }
  get showBottomLabel(): boolean {
    return this._showBottomLabel;
  }

  constructor(protected _elemRef: ElementRef) {}

  writeValue(value: any) {
    const update = { ...this.value, ...value };
    this.valueChange.emit(update);
  }

  getPickerPosition(): [number, number] {
    // TODO: cleanup
    const { innerWidth, innerHeight } = window;
    const { top, left } = this._elemRef.nativeElement.getBoundingClientRect();
    const x = left - OVERLAY_WIDTH;
    const y = top - half(OVERLAY_HEIGHT);
    return [clamp(x, PADDING, innerWidth), clamp(y, PADDING, innerHeight)];
  }
}
