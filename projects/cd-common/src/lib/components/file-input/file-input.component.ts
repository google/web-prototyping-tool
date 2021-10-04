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

import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'cd-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileInputComponent {
  private _multiple = false;
  public files: FileList | File[] = [];

  @Input() acceptedMimeTypes: ReadonlyArray<string> = [];

  @Input() set multiple(multiple: boolean) {
    this._multiple = coerceBooleanProperty(multiple);
  }
  get multiple() {
    return this._multiple;
  }

  /**
   * Returns a list of the Files selected from the system file picker
   */
  @Output() filesChosen = new EventEmitter<FileList | File[]>();

  onFilesSelected(e: Event) {
    const inputElement = e.target as HTMLInputElement;
    if (!inputElement) return;
    const files = inputElement.files ?? [];
    this.files = files;
    this.filesChosen.emit(files);
  }
}
