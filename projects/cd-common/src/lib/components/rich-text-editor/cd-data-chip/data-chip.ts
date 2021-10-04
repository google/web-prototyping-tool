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

import { DATASET_DELIMITER, DATA_CHIP_LOOKUP_ATTR, DATA_CHIP_SOURCE_ATTR } from 'cd-common/consts';

const styles = `
:host {
  min-width: 13px;
  max-width: fit-content;
  height: 13px;
  background: var(--cd-font-color);
  display: inline-grid;
  grid-template-columns: 1fr auto;
  border-radius: 13px;
  margin: 0 4px;
  overflow: hidden;
  color: var(--cd-inverted-font-color);
  font-size: 11px;
  line-height: 1.2em;
  padding: 0 3px;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  transition: box-shadow 100ms ease;
  box-shadow: 0 0 0 1px var(--cd-font-color);
}

:host(:hover) {
  background: var(--cd-primary-color);
  box-shadow: 0 0 0 1px var(--cd-primary-color);
}

button::before {
  content: 'close';
}

button {
  width: 0;
  color: inherit;
  transition: width 100ms ease;
  font-family: 'Google Material Icons';
  font-weight: normal;
  font-style: normal;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  font-feature-settings: 'liga';
  font-size: 13px;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
  -webkit-font-smoothing: antialiased;
  border: none;
  padding: 0;
  outline: none;
  margin-right: -2px;
}

:host(:hover) button {
  width: 13px;
}
`;

const BUTTON_TAG = 'BUTTON';
const SPAN_TAG = 'SPAN';
// the following is a compiler flag for angular
// @dynamic
export default class DataChipElement extends HTMLElement {
  private _highlighted = false;
  public source = '';
  public lookup = '';
  public span: HTMLSpanElement;
  public shadow: ShadowRoot;

  constructor() {
    super();
    const sheet = new CSSStyleSheet();
    const shadow = this.attachShadow({ mode: 'closed' });
    const span = document.createElement(SPAN_TAG);
    const button = document.createElement(BUTTON_TAG);
    shadow.appendChild(span);
    shadow.appendChild(button);
    // These are not recognized by vscode but are part of
    // the web component + stylesheet apis
    (sheet as any).replace(styles);
    (shadow as any).adoptedStyleSheets = [sheet];
    ////////////////////////////////////////////////////
    this.span = span;
    this.shadow = shadow;
    this.contentEditable = String(false);
  }

  updateContent() {
    const items = this.lookup.split(DATASET_DELIMITER);
    this.span.textContent = items?.[items.length - 1];
  }

  static get observedAttributes() {
    return [DATA_CHIP_SOURCE_ATTR, DATA_CHIP_LOOKUP_ATTR];
  }

  /**
   * Ask the web component what was clicked inside since this
   * is a closed shadow dom... and there is only one button
   */
  didClickCloseBtn(x: number, y: number): boolean {
    const elem = this.shadow.elementFromPoint(x, y);
    return elem?.tagName === BUTTON_TAG; // Close button
  }

  get highlighted() {
    return this._highlighted;
  }

  highlight(highlight: boolean) {
    if (this._highlighted === highlight) return;
    this.style.background = highlight ? `var(--cd-primary-color)` : '';
    this._highlighted = highlight;
  }

  /** Added to page */
  connectedCallback() {
    this.updateContent();
  }

  disconnectedCallback() {}

  attributeChangedCallback(name: any, oldValue: any, newValue: any) {
    if (oldValue === newValue) return;
    if (name === DATA_CHIP_LOOKUP_ATTR) this.lookup = newValue;
    if (name === DATA_CHIP_SOURCE_ATTR) this.source = newValue;
    this.updateContent();
  }
}
