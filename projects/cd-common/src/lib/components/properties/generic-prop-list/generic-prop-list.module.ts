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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericPropListComponent } from './generic-prop-list.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PropertyListItemModule } from '../property-list-item/property-list-item.module';
import { IconModule } from '../../icon/icon.module';
import { CheckboxModule } from '../../checkbox/checkbox.module';
import { TooltipModule } from '../../../directives/tooltip/tooltip.module';
import { GenericPropEditorComponent } from './generic-prop-editor/generic-prop-editor.component';
import { SelectInputModule } from '../../input/select-input/select-input.module';
import { SelectModule } from '../../select/select.module';
import { InputGroupModule } from '../../input-group/input-group.module';
import { InputModule } from '../../input/input.module';
import { IconInputModule } from '../../input/icon/icon-input.module';
import { ButtonModule } from '../../button/button.module';
import {
  GenericListItemCheckboxTooltipPipe,
  IsGenericListItemSelectedPipe,
} from './generic-props-list.pipe';

@NgModule({
  declarations: [
    GenericPropListComponent,
    GenericPropEditorComponent,
    GenericListItemCheckboxTooltipPipe,
    IsGenericListItemSelectedPipe,
  ],
  exports: [GenericPropListComponent],
  imports: [
    SelectInputModule,
    SelectModule,
    InputGroupModule,
    IconInputModule,
    InputModule,
    CheckboxModule,
    CommonModule,
    DragDropModule,
    TooltipModule,
    PropertyListItemModule,
    IconModule,
    CheckboxModule,
    ButtonModule,
  ],
})
export class GenericPropListModule {}
