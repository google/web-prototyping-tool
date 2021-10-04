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
  EventEmitter,
  Output,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener,
  HostBinding,
} from '@angular/core';
import { keyCheck, KEYS } from 'cd-utils/keycodes';
import { MeasuredInputComponent } from '../../measured-text/measured-input.component';

@Component({
  selector: 'cd-chip-input',
  templateUrl: './chip-input.component.html',
  styleUrls: ['./chip-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipInputComponent {
  public value = '';

  @Input() chips: string[] = [];

  @HostBinding('class.disabled')
  @Input()
  disabled?: boolean;

  @Output() chipsChange = new EventEmitter<string[]>();

  @ViewChild('inputRef', { read: ElementRef, static: true }) _inputEl!: ElementRef;
  @ViewChild('inputRef', { read: MeasuredInputComponent, static: true })
  _measuredInput!: MeasuredInputComponent;

  @HostBinding('class.focus')
  focus = false;

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    const outsideClick = !this._elementRef.nativeElement.contains(event.target);

    if (outsideClick) {
      this.focus = false;
    }
  }

  @HostListener('click')
  onClick() {
    this._inputEl.nativeElement.focus();
  }

  constructor(private _cdRef: ChangeDetectorRef, private _elementRef: ElementRef) {}

  get inputValue(): string {
    return this._inputEl.nativeElement.value;
  }

  onInputFocus() {
    this.focus = true;
    this._cdRef.markForCheck();
  }

  onInputBlur() {
    this._addChip();
    this._measuredInput.update();
    this._cdRef.markForCheck();
  }

  onInputKeydown(e: KeyboardEvent) {
    const { key } = e;

    if (keyCheck(key, KEYS.Enter)) {
      this._addChip();
      this._inputEl.nativeElement.focus();
    } else if (keyCheck(key, KEYS.Backspace) && this.inputValue === '') {
      this._removeLastChip();
    }
  }

  onRemoveChip(index: number) {
    this.chips.splice(index, 1);
    this.chipsChange.emit(this.chips);
    this._cdRef.markForCheck();
  }

  private _addChip() {
    const { inputValue } = this;
    if (!inputValue) return;

    // add item to list of chips - dont mutate original array
    const chips = [...this.chips, inputValue.trim()];

    // dedup
    this.chips = Array.from(new Set(chips));
    this.chipsChange.emit(this.chips);

    this._inputEl.nativeElement.value = '';
    this._cdRef.detectChanges();
    this._scrollToBottom();
  }

  private _removeLastChip() {
    this.chips.pop();
    this.chipsChange.emit(this.chips);
    this._cdRef.markForCheck();
  }

  private _scrollToBottom() {
    const { nativeElement } = this._elementRef;
    nativeElement.scrollTop = nativeElement.scrollHeight;
  }
}
