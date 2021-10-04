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
  Output,
  EventEmitter,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { AbstractOverlayContentDirective } from '../overlay/abstract/abstract.overlay-content';
import { OverlayInitService } from '../overlay/overlay.init.service';

@Component({
  selector: 'cd-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent
  extends AbstractOverlayContentDirective
  implements AfterViewInit, OnDestroy
{
  private _focusTimer = 0;

  @Input() title = '';
  @Input() message = '';
  @Input() link?: { url?: string; text?: string };

  @Output() cancel = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<boolean>();

  @ViewChild('confirmButtonRef', { read: ElementRef }) confirmButtonRef!: ElementRef;

  constructor(public overlayInit: OverlayInitService) {
    super(overlayInit);
  }

  ngOnDestroy() {
    window.clearTimeout(this._focusTimer);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    // setTimeout is required here as other methods of autofocusing elements seem to not work
    this._focusTimer = window.setTimeout(() => {
      this.confirmButtonRef?.nativeElement?.focus();
    }, 100);
  }

  onCancelClick() {
    this.cancel.emit(false);
    this.dismissOverlay.emit();
  }

  onConfirmClick() {
    this.confirm.emit(true);
    this.dismissOverlay.emit();
  }
}
