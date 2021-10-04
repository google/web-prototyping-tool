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

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IShadowStyle } from 'cd-interfaces';
import { AbstractPropListDirective } from '../abstract/abstract.proplist';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'cd-shadow-props',
  templateUrl: './shadow-props.component.html',
  styleUrls: ['./shadow-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadowPropsComponent extends AbstractPropListDirective {
  private _data: IShadowStyle[] = [];
  isTextShadow = false;

  @Input()
  set textShadow(value: boolean | string | undefined) {
    this.isTextShadow = coerceBooleanProperty(value);
  }

  @Input()
  set data(value: IShadowStyle[]) {
    this._data = value ? [...value] : [];
  }
  get data(): IShadowStyle[] {
    return this._data;
  }

  @Output() change = new EventEmitter<IShadowStyle[]>();
  onDrop(e: CdkDragDrop<IShadowStyle[]>) {
    moveItemInArray(this._data, e.previousIndex, e.currentIndex);
    this.change.emit(this._data);
  }
}
