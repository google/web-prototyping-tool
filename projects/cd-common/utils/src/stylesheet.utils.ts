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

import { generateIDWithLength } from 'cd-utils/guid';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { appendAdoptedStyleSheet } from 'cd-utils/stylesheet';
import { toKebabCase, toSnakeCase } from 'cd-utils/string';
import { MARK_FOR_DELETE_GLOBAL } from 'cd-common/consts';
import { transformPropsToStyle } from './css.utils';
import { isNumber } from 'cd-utils/numeric';
import * as cd from 'cd-interfaces';

const UNDERSCORE = '_';
const VALID_CSS_REGEX = /[_a-zA-Z0-9-]/g;
const DEFAULT_PREFIX = 'co___';
const STYLESHEET_ID = 'co-style';
const _styleManagerMap = new WeakMap<Window, StyleManager>();

const mapProps = ([propName, propValue]: [string, string]) => {
  const name = toKebabCase(propName);
  return `${name}:${propValue};`;
};

export const makeSelector = (className: string, key: string) => {
  const suffix = key === cd.State.Default ? '' : key;
  return `.${className}${suffix}`;
};

export const buildCSS = (value: cd.IStringMap<string> | undefined): string => {
  return value ? Object.entries(value).map(mapProps).join('') : '';
};

export const buildRule = (selector: string, cssText: string): string => `${selector}{${cssText}}`;

const removeAdoptedStyleSheetWithId = (id: string, doc: HTMLDocument) => {
  const anyDoc = doc as any;
  const adoptedSheets = anyDoc.adoptedStyleSheets || [];
  const sheetIdx = adoptedSheets.findIndex((sheet: any) => sheet.cdMarker === id);
  if (sheetIdx === -1) return;
  anyDoc.adoptedStyleSheets = removeValueFromArrayAtIndex(sheetIdx, adoptedSheets);
};

const windowRefForElement = (rootNode: HTMLDocument): Window => {
  const doc = rootNode.ownerDocument || (rootNode as HTMLDocument);
  return doc.defaultView as Window;
};

const generateStyleSheet = (id: string, rootNode: HTMLDocument): CSSStyleSheet => {
  const doc = rootNode.ownerDocument || (rootNode as HTMLDocument);
  // Ensure that the shadow root's window is used to create the stylesheet
  const sheet = new (doc.defaultView as any).CSSStyleSheet();
  sheet.cdMarker = id;
  const anyRoot = rootNode as any;
  appendAdoptedStyleSheet(anyRoot, sheet);
  return sheet;
};

export class StyleManager {
  public sheet: CSSStyleSheet;
  private _rules: string[] = [];
  private _selectors: string[] = [];
  private _uids: Symbol[] = [];

  /** Lookup instance of StyleManager which is held in a weakMap */
  static instance(rootNode: HTMLDocument): StyleManager | undefined {
    const ref = windowRefForElement(rootNode);
    if (!ref || MARK_FOR_DELETE_GLOBAL in ref) return;
    const styleManager = _styleManagerMap.get(ref);
    if (styleManager !== undefined) return styleManager;
    const manager = new StyleManager(rootNode);
    _styleManagerMap.set(ref, manager);
    return manager;
  }

  static hasInstance(rootNode: HTMLDocument): boolean {
    const ref = windowRefForElement(rootNode);
    return _styleManagerMap.has(ref);
  }

  static deleteInstanceForWindow(win?: Window | null) {
    if (!win) return;
    const styleManager = _styleManagerMap.get(win);
    if (!styleManager) return;
    styleManager.destroy(win.document);
    _styleManagerMap.delete(win);
  }

  static generateClassStylePrefix(id?: string, classPrefix?: string): string {
    const identifier = id || generateIDWithLength(6);
    const prefix = classPrefix ? `${classPrefix}-` : '';
    return DEFAULT_PREFIX + prefix + identifier;
  }

  constructor(rootNode: HTMLDocument) {
    this.sheet = generateStyleSheet(STYLESHEET_ID, rootNode);
  }

  destroy(rootNode: HTMLDocument) {
    removeAdoptedStyleSheetWithId(STYLESHEET_ID, rootNode);
  }

  indexOfSelector(selector: string, uid: Symbol): number {
    const { _selectors, _uids } = this;
    return _selectors.findIndex((str, idx) => str === selector && _uids[idx] === uid);
  }

  hasRuleChangedAtIndex(idx: number, rule: string): boolean {
    return this._rules[idx] !== rule;
  }

  removeRuleAtIndex(sheet: CSSStyleSheet, idx: number): void {
    if (idx === -1) return;
    this._selectors = removeValueFromArrayAtIndex(idx, this._selectors);
    this._rules = removeValueFromArrayAtIndex(idx, this._rules);
    this._uids = removeValueFromArrayAtIndex(idx, this._uids);
    sheet.deleteRule(idx);
  }

  assignRule(sheet: CSSStyleSheet, rule: string, selector: string, uid: Symbol) {
    const idx = sheet.cssRules.length;
    this._selectors[idx] = selector;
    this._rules[idx] = rule;
    this._uids[idx] = uid;
    sheet.insertRule(rule, idx);
  }

  addRules(style: cd.IStyles, name: string, uid: Symbol) {
    const { sheet } = this;
    const rules = Object.entries(style);

    for (const [key, value] of rules) {
      const selector = makeSelector(name, key);
      const cssText = buildCSS(value);
      const rule = buildRule(selector, cssText);
      const idx = this.indexOfSelector(selector, uid);
      const ruleChanged = idx === -1 || this.hasRuleChangedAtIndex(idx, rule);
      if (!ruleChanged) continue;
      this.removeRuleAtIndex(sheet, idx);
      this.assignRule(sheet, rule, selector, uid);
    }
  }

  addRulesAndReturnClass(
    style: cd.IStyles | undefined,
    className: string | undefined,
    uid: Symbol
  ) {
    if (!style || !className) return;
    this.addRules(style, className, uid);
  }

  removeAllRulesForClass(_className: string, uid: Symbol) {
    const { sheet, _selectors, _uids } = this;
    for (let i = _selectors.length - 1; i >= 0; i--) {
      const item = _selectors[i];
      const sym = _uids[i];
      if (sym !== uid) continue;
      if (item.includes(_className)) {
        this.removeRuleAtIndex(sheet, i);
      }
    }
  }
}

export const generateStyle = (
  styles: cd.IStyleAttributes,
  bindings: cd.IProjectBindings
): cd.IStyleAttributes => {
  const styleMap = {} as cd.IStyleAttributes;
  for (const [key, value] of Object.entries(styles)) {
    if (!value) continue;
    styleMap[key] = transformPropsToStyle(value, bindings);
  }
  return styleMap;
};

export const classNameFromProps = (prop: cd.PropertyModel) => {
  const { id, name } = prop;
  const className = toSnakeCase(name) + UNDERSCORE + UNDERSCORE + id;
  return [...className]
    .map((char, i) => {
      if (i === 0 && isNumber(char)) return UNDERSCORE;
      const isValid = char.match(VALID_CSS_REGEX)?.[0] === char;
      return isValid ? char : UNDERSCORE;
    })
    .join('');
};
