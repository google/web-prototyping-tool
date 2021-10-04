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
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { cssProperties, CSSSelector, CSSSelectorType } from 'cd-metadata/css';
import { InputComponent } from '../../input/input.component';
import * as utils from './advanced-props.utils';
import * as cd from 'cd-interfaces';

const CONTENT: cd.IKeyValue = { name: 'content', value: "''" };
const DEFAULT_SELECTORS: utils.ICSSSelector[] = [
  { title: 'Style', selector: CSSSelector.Base },
  { title: ':Hover', selector: CSSSelector.Hover },
  { title: ':Before', selector: CSSSelector.Before, autoValues: [CONTENT] },
  { title: ':After', selector: CSSSelector.After, autoValues: [CONTENT] },
  { title: ':Active', selector: CSSSelector.Active },
  { title: ':Focus', selector: CSSSelector.Focus },
  { title: ':Focus-Within', selector: CSSSelector.FocusWithin },
];

@Component({
  selector: 'cd-advanced-props',
  templateUrl: './advanced-props.component.html',
  styleUrls: ['./advanced-props.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedPropsComponent {
  private _styles: cd.IStyleAttributes = { base: {} };
  public selectors: utils.ICSSSelector[] = DEFAULT_SELECTORS;
  public styleAttributes: string[] = cssProperties;
  public addingPseudo = false;
  public validPseudo = true;

  @Input() designSystem!: cd.IDesignSystem;
  @Input() projectAssets!: cd.AssetMap;
  @Input() hideAdvancedAttrs = false;
  @Input() attr: cd.IKeyValue[] = [];
  @Input()
  set styles(value: cd.IStyleAttributes) {
    this._styles = value;
    this.processSelectors(value);
  }
  get styles() {
    return this._styles;
  }

  @Output() attrChange = new EventEmitter<cd.IKeyValue[]>();
  @Output() stylesChange = new EventEmitter<Partial<cd.IStyleAttributes>>();

  @ViewChild('pseudoInput', { static: false }) pseudoInput?: InputComponent;

  constructor(private _cdRef: ChangeDetectorRef) {}

  processSelectors(value: cd.IStyleAttributes) {
    const selectors = Object.keys(value);
    const defaultKeys: string[] = DEFAULT_SELECTORS.map((item) => item.selector);
    const addedKeys = selectors.filter((selector) => !defaultKeys.includes(selector));
    const addedSelectors = addedKeys.map(utils.generateRemovableSelector);
    this.selectors = [...DEFAULT_SELECTORS, ...addedSelectors];
  }

  trackByFn(_idx: number, item: utils.ICSSSelector) {
    return item.selector;
  }

  onDeleteGroup(selector: CSSSelectorType) {
    const nullSelector = { [selector]: null } as unknown as Partial<cd.IStyleAttributes>;
    this.stylesChange.emit(nullSelector);
  }

  onStyleOverride(overrides: cd.IKeyValue[], selector: CSSSelectorType) {
    this.publishOverridesForSelector(overrides, selector);
  }

  onAttributesUpdate(update: cd.IKeyValue[]) {
    this.attrChange.emit(update);
  }

  publishOverridesForSelector(overrides: cd.IKeyValue[], selector: CSSSelectorType) {
    const styleOverrides: Partial<cd.IStyleAttributes> = { [selector]: { overrides } };
    this.stylesChange.emit(styleOverrides);
  }

  closePseudoInput() {
    this.addingPseudo = false;
    this.validPseudo = true;
  }

  onPseudoClassInput(value: string) {
    const pseudo = utils.processPseudoClass(value);
    if (!pseudo) return this.closePseudoInput();
    const invalid = !utils.isSelectorValid(pseudo, this.selectors);
    this.validPseudo = !invalid;
    if (invalid) return;
    const selector = utils.generateRemovableSelector(pseudo);
    this.selectors.push(selector);
    this.closePseudoInput();
  }

  onPseudoClassBlur(focused: boolean) {
    if (focused) return;
    this.closePseudoInput();
  }

  onAddPseudoClass() {
    this.addingPseudo = true;
    this._cdRef.detectChanges();
    this.pseudoInput?.triggerComponentFocus();
  }
}
