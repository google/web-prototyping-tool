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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { TextAlign } from '../rich-text.consts';

@Component({
  selector: 'cd-text-alignment',
  templateUrl: './text-alignment.component.html',
  styleUrls: ['./text-alignment.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextAlignmentComponent {
  public TextAlign = TextAlign;

  @Input() value?: TextAlign;
  @Output() valueChange = new EventEmitter<TextAlign>();

  get alignment() {
    return this.value || TextAlign.Left;
  }

  onAlignmentChange(value: TextAlign) {
    this.valueChange.emit(value);
  }
}
