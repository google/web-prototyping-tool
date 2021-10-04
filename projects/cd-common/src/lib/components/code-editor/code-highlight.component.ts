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

import DEFAULT_STYLES from './code-highlight.styles';
import { escapeHtml } from './code-highlight.utils';
import Prism from 'prismjs';

const PRISM_JS_LANG_JS_TAG = 'language-js';
export const CODE_HIGHLIGHT_TAG = 'cd-code-highlight';

export default class CodeHighlightComponent extends HTMLElement {
  private _value = '';
  private _content: HTMLElement;
  constructor() {
    super();
    const sheet = new CSSStyleSheet();
    const shadow = this.attachShadow({ mode: 'closed' });
    (sheet as any).replace(DEFAULT_STYLES);
    (shadow as any).adoptedStyleSheets = [sheet];
    const container = document.createElement('div');
    container.className = 'container';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.classList.add(PRISM_JS_LANG_JS_TAG);
    pre.appendChild(code);
    container.appendChild(pre);
    shadow.appendChild(container);
    this._content = code;
  }

  updateContent() {
    this._content.innerHTML = escapeHtml(this._value);
    Prism.highlightElement(this._content, false);
  }

  set value(value: string) {
    if (this._value === value) return;
    this._value = value;
    this.updateContent();
  }

  get value(): string {
    return this._value;
  }
}
