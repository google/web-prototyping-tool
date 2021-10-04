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
import { TextFormat } from '../rich-text.consts';

@Component({
  selector: 'cd-text-justify',
  templateUrl: './text-justify.component.html',
  styleUrls: ['./text-justify.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextJustifyComponent {
  public TextFormat = TextFormat;

  @Input() value?: TextFormat;
  @Output() valueChange = new EventEmitter<TextFormat>();

  get alignment() {
    return this.value || TextFormat.JustifyLeft;
  }

  onAlignmentChange(value: TextFormat) {
    this.valueChange.emit(value);
  }
}
