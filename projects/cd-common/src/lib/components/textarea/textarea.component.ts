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

import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  AfterViewInit,
  HostBinding,
} from '@angular/core';
import { KEYS } from 'cd-utils/keycodes';

type TextAreaResizeType = 'none' | 'both' | 'horizontal' | 'vertical' | 'initial' | 'inherit';

const TEXTAREA_MAX_HEIGHT = 500;
const MAX_CHAR_LEN = 20;
const FOCUS_TIMEOUT = 60;

@Component({
  selector: 'cd-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaComponent implements AfterViewInit {
  private _codeMode = false;

  @Input() autofocus = false;
  @Input() label?: string;
  @Input() value = '';
  @Input() disabled?: boolean;
  @Input() rows: number | null = null;
  @Input() cols: number | null = null;

  @Input()
  @HostBinding('class.code')
  set codeMode(value: boolean) {
    this._codeMode = coerceBooleanProperty(value);
  }

  get codeMode() {
    return this._codeMode;
  }

  @Input() minHeight = '';
  @Input() placeholder = '';
  @Input() spellcheck = true;
  @Input() resize: TextAreaResizeType = 'none';
  @Input() resizeToFitTextOnInit = true;
  @Output() change = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('textareaRef', { read: ElementRef, static: true }) public textareaRef!: ElementRef;

  constructor(protected _cdRef: ChangeDetectorRef) {}

  get textarea(): HTMLTextAreaElement {
    return this.textareaRef.nativeElement;
  }

  focusOnTextArea() {
    setTimeout(() => {
      const { textarea } = this;
      if (!textarea) return;
      const len = this.textareaValue.length ?? 0;
      const startPos = len < MAX_CHAR_LEN ? len - 2 : 0;
      textarea.setSelectionRange(startPos, startPos);
      textarea.focus();
    }, FOCUS_TIMEOUT);
  }

  get textareaValue() {
    return this.textarea.value;
  }

  ngAfterViewInit() {
    if (this.autofocus) this.focusOnTextArea();
    if (!this.resizeToFitTextOnInit) return;

    // requestAnimationFrame required to ensure that the textarea has scrollHeight before computing
    requestAnimationFrame(() => {
      const { textarea } = this;
      const currentHeight = textarea.clientHeight;
      const heightToFit = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT);
      if (heightToFit > currentHeight) textarea.style.height = `${heightToFit}px`;
    });
  }

  onInput(e: InputEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.valueChange.emit(this.textareaValue);
  }

  onChange(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.updateValue();
  }

  onKeydown(e: KeyboardEvent) {
    const { key } = e;
    if (key === KEYS.Tab) {
      e.preventDefault();
      document.execCommand('insertText', false, ' '.repeat(2));
    }
  }

  updateValue() {
    const { textareaValue } = this;

    if (this.value !== textareaValue) {
      this.value = textareaValue;
      this.change.emit(textareaValue);
      this._cdRef.markForCheck();
    }
  }
}
