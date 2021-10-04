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
  HostBinding,
  Output,
  EventEmitter,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { PropertyModel, ElementPropertiesMap } from 'cd-interfaces';
import { copyToClipboard } from 'cd-utils/clipboard';
import { keyValueAttrsToString } from 'cd-common/utils';

const MAX_BREADCRUMB_LENGTH = 2;

@Component({
  selector: 'app-a11y-info',
  templateUrl: './a11y-info.component.html',
  styleUrls: ['./a11y-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class A11yInfoComponent {
  private _overlay = false;
  private _activeElement?: PropertyModel;
  private _props?: ElementPropertiesMap;

  public activeElementBreadcrumbs: PropertyModel[] = [];

  @Input()
  set props(props: ElementPropertiesMap | undefined) {
    this._props = props;
    this.loadBreadcrumbs();
  }
  get props() {
    return this._props;
  }

  @Input()
  set activeElement(element: PropertyModel | undefined) {
    this._activeElement = element;
    this.loadBreadcrumbs();
  }
  get activeElement() {
    return this._activeElement;
  }

  @HostBinding('class.overlay')
  @Input()
  set overlay(val: boolean) {
    this._overlay = coerceBooleanProperty(val);
  }
  get overlay() {
    return this._overlay;
  }

  @Output() elementIdSelection = new EventEmitter<string>();

  get activeElementAttrs() {
    return this.activeElement?.a11yInputs?.ariaAttrs || [];
  }

  get elementNotes() {
    return this.activeElement?.a11yInputs?.notes;
  }

  onCopyAttrsClick() {
    const copyText = keyValueAttrsToString(this.activeElementAttrs);
    copyToClipboard(copyText);
  }

  onElementIdSelection(id?: string) {
    this.elementIdSelection.emit(id || '');
  }

  loadBreadcrumbs() {
    this.activeElementBreadcrumbs = this.getElementParents(
      this.activeElement,
      this.props,
      MAX_BREADCRUMB_LENGTH
    );
  }

  getElementParents(
    element?: PropertyModel,
    props?: ElementPropertiesMap,
    levelLimit?: number
  ): PropertyModel[] {
    if (!element || !props) return [];

    const parent = element.parentId && props[element.parentId];
    const levelLimitMet = levelLimit !== undefined && levelLimit <= 0;
    if (!parent || levelLimitMet) return [];
    if (levelLimit === 1) return [parent];

    const remainingLevels = levelLimit !== undefined ? levelLimit - 1 : 0;
    const ancestors = this.getElementParents(parent as PropertyModel, props, remainingLevels);
    return [...ancestors, parent];
  }
}
