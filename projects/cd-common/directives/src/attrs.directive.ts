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
import { areObjectsEqual } from 'cd-utils/object';
import * as cd from 'cd-interfaces';
import { convertKeyValuesToMap, validAttrForKeyValue } from 'cd-common/utils';

type KeyMap = cd.IStringMap<cd.IKeyValue>;

@Directive({
  selector: '[cdAttrs]',
})
export class AttrsDirective implements OnInit {
  private _attrs: cd.IKeyValue[] = [];
  private _attrsMap: KeyMap = {};
  private init = false;

  constructor(private _elementRef: ElementRef, private _renderer: Renderer2) {}

  @Input()
  set cdAttrs(newAttrs: cd.IKeyValue[]) {
    const { _attrs } = this;
    if (areObjectsEqual(_attrs, newAttrs)) return;
    this._attrs = newAttrs;
    this.updateAttrs();
  }

  ngOnInit() {
    this.init = true;
    this.updateAttrs();
  }

  get element(): HTMLElement {
    return this._elementRef.nativeElement;
  }

  getUpdatedKeys(updatedAttrsMap: KeyMap, attrsMap: KeyMap): string[] {
    return Object.entries(updatedAttrsMap).reduce<string[]>((acc, [key, newEntry]) => {
      const oldEntry = attrsMap[key];
      const keyIsValid = validAttrForKeyValue(newEntry);
      const keyIsUnique = oldEntry === undefined || oldEntry.value !== newEntry.value;
      if (keyIsValid && keyIsUnique) acc.push(key);
      return acc;
    }, []);
  }

  getDeletedKeys(attrsMap: KeyMap, updatedAttrsMap: KeyMap): string[] {
    const newKeys = Object.keys(updatedAttrsMap);
    return Object.entries(attrsMap)
      .filter(([key, value]) => {
        const keyDeleted = newKeys.indexOf(key) === -1;
        const keyDisabled = value.disabled;
        return keyDeleted || keyDisabled;
      })
      .map(([key]) => key);
  }

  private updateAttrs() {
    if (!this.init) return;
    const { _attrs, _attrsMap } = this;
    const updatedAttrsMap = convertKeyValuesToMap(_attrs);
    const updatedKeys = this.getUpdatedKeys(updatedAttrsMap, _attrsMap);
    const deletedKeys = this.getDeletedKeys(_attrsMap, updatedAttrsMap);

    this._attrsMap = updatedAttrsMap;

    const { _renderer, element } = this;

    for (const updatedKey of updatedKeys) {
      if (!updatedKey) continue;
      const entry = updatedAttrsMap[updatedKey];
      const attrValue = entry.value ? entry.value.toString() : '';
      _renderer.setAttribute(element, updatedKey, attrValue);
    }

    for (const deletedKey of deletedKeys) {
      if (!deletedKey) continue;
      _renderer.removeAttribute(element, deletedKey);
    }
  }
}
