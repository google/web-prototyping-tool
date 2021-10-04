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
  Output,
  EventEmitter,
  Input,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Subscription, fromEvent, merge } from 'rxjs';

const INPUT_TAG = 'INPUT';
const CHECKBOX_TYPE = 'checkbox';

@Component({
  selector: 'cd-checkbox-input',
  templateUrl: './checkbox.input.component.html',
  styleUrls: ['./checkbox.input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxInputComponent implements OnDestroy {
  private _subscription = Subscription.EMPTY;
  private _targetEvent = Subscription.EMPTY;

  @Input() label?: string;
  @Input() disabled = false;
  @Input() tabindex = 0;

  @Input() dragApply = false;

  @Input() checked = false;
  @Output() readonly focus = new EventEmitter<boolean>();
  @Output() readonly blur = new EventEmitter<boolean>();

  @ViewChild('inputRef', { read: ElementRef, static: true }) inputRef!: ElementRef;

  onBlur() {
    this.blur.emit();
  }

  onFocus() {
    this.focus.emit();
  }

  constructor(private _cdRef: ChangeDetectorRef) {}

  focusCheckbox() {
    this.inputRef?.nativeElement.focus();
  }

  onMousedown(e: MouseEvent) {
    if (!this.dragApply) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLInputElement;
    target.click();
    this._cdRef.detectChanges();
    this._subscription = new Subscription();
    this._targetEvent = new Subscription();
    const click$ = fromEvent<MouseEvent>(window, 'click', { capture: true });
    const move$ = fromEvent<MouseEvent>(document, 'mousemove');
    this._targetEvent.add(click$.subscribe(this.onClick));
    this._subscription.add(move$.subscribe(this.onMouseMove));
    this._subscription.add(
      merge(
        fromEvent<MouseEvent>(target, 'mouseup'),
        fromEvent<MouseEvent>(document, 'mouseup')
      ).subscribe(this.onCancel)
    );
  }

  onClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    this._targetEvent.unsubscribe();
  };

  onMouseMove = (e: MouseEvent) => {
    const target = e.target as HTMLInputElement;
    if (target.tagName === INPUT_TAG && target.type === CHECKBOX_TYPE) {
      const toggleState = this.checked;
      if (target.checked !== toggleState) {
        target.click();
      }
    }
  };

  onCancel = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this._subscription.unsubscribe();
  };

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._targetEvent.unsubscribe();
  }
}
