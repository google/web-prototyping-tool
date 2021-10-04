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
  EventEmitter,
  Output,
  Input,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit,
  HostBinding,
} from '@angular/core';
import CodeHighlightComponent, { CODE_HIGHLIGHT_TAG } from './code-highlight.component';
import { translate3d } from 'cd-utils/css';
import { KEYS } from 'cd-utils/keycodes';

import { AUTO_VALUE } from 'cd-common/consts';

const MAX_CHAR_LEN = 20;
const FOCUS_TIMEOUT = 60;

@Component({
  selector: 'cd-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorComponent implements AfterViewInit {
  private _value = '';
  public textValue = '';
  public scrollPosition = '';

  @Input()
  @HostBinding('style.height.px')
  height = AUTO_VALUE;

  @Input() resizable = false;
  @Input() autofocus = false;
  @Input() spellcheck = false;
  @Input() rows: number | null = null;
  @Input() cols: number | null = null;
  @Input() disabled?: boolean;
  @Input() placeholder = '';
  @Input()
  set value(value) {
    this._value = value;
    this.textValue = value;
  }
  get value() {
    return this._value;
  }

  @Output() change = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('textareaRef', { read: ElementRef, static: true }) public textareaRef!: ElementRef;
  @ViewChild('codeRef', { read: ElementRef, static: true }) public codeRef!: ElementRef;

  constructor(protected _cdRef: ChangeDetectorRef) {
    const chipElementConstructor = customElements.get(CODE_HIGHLIGHT_TAG);
    if (!chipElementConstructor) customElements.define(CODE_HIGHLIGHT_TAG, CodeHighlightComponent);
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

  ngAfterViewInit(): void {
    if (this.autofocus) this.focusOnTextArea();
  }

  get codeElem(): HTMLElement {
    return this.codeRef.nativeElement;
  }

  get textarea(): HTMLTextAreaElement {
    return this.textareaRef.nativeElement;
  }

  get textareaValue() {
    return this.textarea.value;
  }

  onInput(e: InputEvent) {
    e.preventDefault();
    e.stopPropagation();
    const value = this.textareaValue;
    this.textValue = value;
    this.valueChange.emit(value);
  }

  onChange(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.updateValue();
  }

  onScroll() {
    const { scrollLeft, scrollTop } = this.textarea;
    this.scrollPosition = translate3d(-scrollLeft, -scrollTop);
  }

  onKeydown(e: KeyboardEvent) {
    const { key } = e;
    if (key === KEYS.Tab) {
      e.preventDefault();
      document.execCommand('insertText', false, ' '.repeat(2));
    }
  }

  onResize(size: number) {
    this.height = String(size);
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
