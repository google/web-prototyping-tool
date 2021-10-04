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
  Input,
  AfterViewInit,
  EventEmitter,
  Output,
  ChangeDetectorRef,
} from '@angular/core';
import { OverlayInitService } from '../overlay/overlay.init.service';
import { OverlayService } from '../overlay/overlay.service';

@Component({
  selector: 'cd-code-editor-modal',
  templateUrl: './code-editor-modal.component.html',
  styleUrls: ['./code-editor-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorModalComponent implements AfterViewInit {
  @Input() value = '';
  @Input() isValid = true;
  @Input() title = '';
  @Input() placeholder = '';
  @Output() dismissOverlay = new EventEmitter();
  @Output() codeChange = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<string>();

  constructor(
    public _overlayInit: OverlayInitService,
    private _cdRef: ChangeDetectorRef,
    private _overlayService: OverlayService
  ) {}

  updateValidity(value: boolean) {
    this.isValid = value;
    this._cdRef.detectChanges();
  }

  updateValue(value: string) {
    this.value = value;
    this._cdRef.detectChanges();
  }

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
  }

  onValueChange(value: string) {
    this.valueChange.emit(value);
  }

  onChange(value: string) {
    this.codeChange.emit(value);
  }

  onClose() {
    this._overlayService.close();
  }
}
