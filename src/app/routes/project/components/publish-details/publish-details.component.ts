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

import * as cd from 'cd-interfaces';
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  AfterContentInit,
} from '@angular/core';
import { InputComponent } from 'cd-common';

@Component({
  selector: 'app-publish-details',
  templateUrl: './publish-details.component.html',
  styleUrls: ['./publish-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishDetailsComponent implements AfterContentInit {
  @Input() name = '';
  @Input() publishEntry?: cd.IPublishEntry;

  @ViewChild('nameInputRef', { read: InputComponent, static: true }) _nameInputRef!: InputComponent;

  @Output() publishEntryChange = new EventEmitter<cd.IPublishEntry>();
  @Output() nameChange = new EventEmitter<string>();

  ngAfterContentInit(): void {
    this._nameInputRef.inputRefElem.select();
  }

  get description() {
    return this.publishEntry?.desc || '';
  }

  get tags() {
    return this.publishEntry?.tags || [];
  }

  onNameChange(value: string) {
    this.nameChange.emit(value);
  }

  onDescriptionChange(desc: string) {
    const update = { ...this.publishEntry, desc } as cd.IPublishEntry;
    this.publishEntryChange.emit(update);
  }

  onTagsChange(tags: string[]) {
    const update = { ...this.publishEntry, tags } as cd.IPublishEntry;
    this.publishEntryChange.emit(update);
  }
}
