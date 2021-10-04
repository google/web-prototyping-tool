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

import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[cdTextInject]',
})
export class TextInjectDirective implements OnInit {
  private _text = '';
  private _isRichText = false;
  private _init = false;

  @Input()
  set cdTextInject(value: any | undefined) {
    if (this._text === value) return;
    this._text = value ?? '';
    this.updateTextOutput();
  }

  @Input()
  set richText(value: boolean) {
    const isRichText = value ?? false;
    if (isRichText === this._isRichText) return;
    if (!isRichText) this.resetInnerHTML();
    this._isRichText = isRichText;
    this.updateTextOutput();
  }

  constructor(private _elemRef: ElementRef) {}

  ngOnInit(): void {
    this._init = true;
    this.updateTextOutput();
  }

  resetInnerHTML() {
    this.writeRichText('');
  }

  get elem() {
    return this._elemRef.nativeElement as HTMLElement;
  }

  writeRichText(text: string) {
    this.elem.innerHTML = text;
  }

  updateTextOutput() {
    if (!this._init) return;
    const { _text, _isRichText, elem } = this;
    if (_isRichText) return this.writeRichText(_text);
    elem.innerText = _text;
  }
}
