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

// Regex to capture brackets of @font-face{ } or .some-class
const CLASS_BRACKET_REGEX = /(@|.)+{[^}]*\}/g;
const STYLESHEET_ID = 'co-font';
const _fontManagerMap = new WeakMap<HTMLDocument, FontManager>();

export const appendAdoptedStyleSheet = (doc: HTMLDocument, sheet: CSSStyleSheet) => {
  const anyDoc = doc as any;
  anyDoc.adoptedStyleSheets = [...anyDoc.adoptedStyleSheets, sheet];
};

export const removeAdoptedStyleSheets = (doc: HTMLDocument) => {
  const anyDoc = doc as any;
  anyDoc.adoptedStyleSheets = [];
};

const generateStyleSheetOldstyle = (_id: string, rootNode: HTMLDocument): CSSStyleSheet => {
  const doc = rootNode.ownerDocument || (rootNode as HTMLDocument);
  const parent = (rootNode as HTMLDocument).head || rootNode;
  const styleTag = doc.createElement('style');

  if (parent) parent.prepend(styleTag);
  return styleTag.sheet as CSSStyleSheet;
};

export class FontManager {
  private _fontCache: Set<string> = new Set();
  protected _sheet?: CSSStyleSheet;

  get sheet(): CSSStyleSheet | undefined {
    if (!this._sheet && this._rootNode !== undefined) {
      this._sheet = generateStyleSheetOldstyle(this._sheetID, this._rootNode);
    }
    return this._sheet;
  }

  static instance(doc: HTMLDocument = document): FontManager {
    let fontManager = _fontManagerMap.get(doc);
    if (!fontManager) {
      fontManager = new FontManager(doc, STYLESHEET_ID);
      _fontManagerMap.set(doc, fontManager);
    }
    return fontManager;
  }

  static deleteInstance(rootNode: HTMLDocument) {
    _fontManagerMap.delete(rootNode);
  }

  constructor(protected _rootNode: HTMLDocument | undefined, protected _sheetID: string) {}

  destroy() {
    if (!this._rootNode) return;
    removeAdoptedStyleSheets(this._rootNode);
    delete this._rootNode;
  }

  hasRule(key: string): boolean {
    return this._fontCache.has(key);
  }

  addRule(text: string, key: string) {
    const { sheet } = this;
    if (!sheet) return;
    if (this._fontCache.has(key)) return;
    this._fontCache.add(key);

    const items = text.match(CLASS_BRACKET_REGEX) || [];
    for (const item of items) {
      sheet.insertRule(item, sheet.cssRules.length);
    }
  }

  clearAll() {
    const { sheet } = this;
    if (!sheet) return;
    this._fontCache.clear();
    const list = Object.values(sheet.cssRules);
    for (let i = list.length - 1; i >= 0; i--) {
      sheet.deleteRule(i);
    }
  }
}
