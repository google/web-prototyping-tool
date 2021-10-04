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

import { Directive, Input, ElementRef, Renderer2, OnInit } from '@angular/core';
import { convertKeyValuesToMap, isA11yAttrDisabled } from 'cd-common/utils';
import { areObjectsEqual } from 'cd-utils/object';
import * as cd from 'cd-interfaces';

@Directive({
  selector: '[cdA11yAttrs]',
})
export class A11yAttrsDirective implements OnInit {
  private _a11yInputs: cd.IA11yInputs = {};
  private init = false;

  constructor(private _elementRef: ElementRef, private _renderer: Renderer2) {}

  @Input()
  set cdA11yAttrs(updatedInputs: cd.IA11yInputs) {
    if (!updatedInputs) return;
    const { _a11yInputs } = this;
    const oldAttrs = _a11yInputs.ariaAttrs || [];
    const updatedAttrs = updatedInputs.ariaAttrs || [];

    if (areObjectsEqual(oldAttrs, updatedAttrs)) return;

    this._a11yInputs = updatedInputs;
    this.updateAttrs(updatedAttrs, oldAttrs);
  }

  ngOnInit() {
    this.init = true;
    const { _a11yInputs } = this;
    const initialAttrs = _a11yInputs.ariaAttrs || [];
    if (initialAttrs.length) this.updateAttrs(initialAttrs);
  }

  private updateAttrs(updatedAttrs: cd.IA11yAttr[], oldAttrs: cd.IA11yAttr[] = []) {
    if (!this.init || updatedAttrs === undefined) return;

    // create some maps for easier lookups
    const updatedAttrsMap = convertKeyValuesToMap(updatedAttrs) as cd.IStringMap<cd.IA11yAttr>;
    const oldAttrsMap = convertKeyValuesToMap(oldAttrs) as cd.IStringMap<cd.IA11yAttr>;

    const { nativeElement } = this._elementRef;

    // Check for and add new/updated attributes
    for (const newAttr of updatedAttrs) {
      if (!newAttr) return;
      const oldAttr = oldAttrsMap[newAttr.name];
      const attrIsNewOrUpdated = oldAttr === undefined || newAttr.value !== oldAttr.value;
      if (attrIsNewOrUpdated && !isA11yAttrDisabled(newAttr)) {
        const attrValue = newAttr.value ? newAttr.value.toString() : '';
        this._renderer.setAttribute(nativeElement, newAttr.name, attrValue);
      }
    }

    // Check for and remove deleted/disabled attributes
    for (const oldAttr of oldAttrs) {
      if (!oldAttr) return;
      const updatedAttr = updatedAttrsMap[oldAttr.name];
      if (!updatedAttr || isA11yAttrDisabled(updatedAttr)) {
        this._renderer.removeAttribute(nativeElement, oldAttr.name);
      }
    }
  }
}
