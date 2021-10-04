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

import { Directive, Input, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { getAttributeDataIdFromElement } from 'cd-common/models';
import { areObjectsEqual } from 'cd-utils/object';
import { IStyles } from 'cd-interfaces';
import { StyleManager } from 'cd-common/utils';

@Directive({ selector: '[cdStyle]' })
export class StyleDirective implements OnInit, OnDestroy {
  private _styleId?: string;
  private _styles?: IStyles;
  /** Each element has a unique id so we can track when it is destroyed, this is needed for timing issues w/ Angular */
  private _uniqueId = Symbol();
  private _className?: string;
  private _classPrefix?: string;

  @Input()
  /** Fixes an issue where styles on boards were not updating in preview when switching */
  set styleId(value: string) {
    if (value === this._styleId) return;
    this._styleId = value;
    this.updateClassName(value);
  }

  @Input()
  set classPrefix(value: string) {
    if (this._classPrefix === value) return;
    this._classPrefix = value;
    const id = getAttributeDataIdFromElement(this.element);
    this.updateClassName(id);
  }

  @Input()
  set cdStyle(values: IStyles | undefined) {
    if (areObjectsEqual(values, this._styles)) return;
    this._styles = values;
    this._applyStyleChanges();
  }

  constructor(private _elementRef: ElementRef) {}

  updateClassName(id?: string) {
    if (!id) return;
    const className = StyleManager.generateClassStylePrefix(id, this._classPrefix);
    if (this._className === className) return;
    if (this._className) this.classList.remove(this._className);
    this._className = className;
    this.classList.add(className);
    this._applyStyleChanges();
  }

  ngOnInit(): void {
    const id = getAttributeDataIdFromElement(this.element);
    this.updateClassName(id);
  }

  get element() {
    return this._elementRef.nativeElement;
  }

  get rootNode() {
    return this.element.ownerDocument;
  }

  get manager(): StyleManager | undefined {
    return StyleManager.instance(this.rootNode);
  }

  get hasStyleManagerInstance() {
    return StyleManager.hasInstance(this.rootNode);
  }

  ngOnDestroy(): void {
    if (!this.hasStyleManagerInstance) return;
    this.manager?.removeAllRulesForClass(this.className, this._uniqueId);
  }

  get classList() {
    return this.element.classList;
  }

  get className(): string {
    return this._className || '';
  }

  private _applyStyleChanges() {
    this.manager?.addRulesAndReturnClass(this._styles, this.className, this._uniqueId);
  }
}
