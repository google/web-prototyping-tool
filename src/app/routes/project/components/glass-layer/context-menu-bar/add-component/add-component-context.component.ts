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

import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { PropertiesService } from '../../../../services/properties/properties.service';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-add-component-context',
  template: `
    <app-components-list-modal
      [size]="size"
      [isolatedSymbolId]="isolatedSymbolId"
      (selectElement)="onElementAdd($event)"
      (exit)="closeModal()"
    ></app-components-list-modal>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddComponentModalComponent {
  @Input() isolatedSymbolId = '';
  @Input() selectedElementId = '';
  @Input() size?: cd.Dimensions;
  @Output() exit = new EventEmitter<void>();

  constructor(private _propertiesService: PropertiesService) {}

  onElementAdd(element: cd.PropertyModel) {
    const { selectedElementId } = this;
    this._propertiesService.insertEntity(selectedElementId, [element]);
  }

  closeModal() {
    this.exit.emit();
  }
}
