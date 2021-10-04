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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import * as cd from 'cd-interfaces';
import * as projStore from '../../../../store';

@Component({
  selector: 'app-replace-component-context',
  template: `
    <app-components-list-modal
      [size]="size"
      [isolatedSymbolId]="isolatedSymbolId"
      [typesToExclude]="excludedTypes"
      (selectElement)="onElementSelected($event)"
      (exit)="closeModal()"
    ></app-components-list-modal>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaceComponentModalComponent {
  public excludedTypes = new Set<cd.ComponentIdentity>();

  @Input() isolatedSymbolId = '';
  @Input() selectedElementId = '';
  @Input() size?: cd.Dimensions;

  @Input() set selectedElementType(value: cd.ElementEntitySubType) {
    const { Generic, SymbolInstance } = cd.ElementEntitySubType;
    const canExclude = value !== Generic && value !== SymbolInstance;
    const excluded = canExclude ? [value] : [];
    this.excludedTypes = new Set(excluded);
  }

  @Output() exit = new EventEmitter<void>();

  constructor(private readonly _projectStore: Store<projStore.IProjectState>) {}

  closeModal() {
    this.exit.emit();
  }

  onElementSelected(element: cd.PropertyModel) {
    const { selectedElementId } = this;
    if (!selectedElementId) return;
    const replaceElementAction = new projStore.ElementPropertiesReplace(selectedElementId, element);
    this._projectStore.dispatch(replaceElementAction);
  }
}
