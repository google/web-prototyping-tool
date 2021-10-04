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
import { KeyValueEditorNextComponent } from './key-value-editor.component';
import { PropertyGroupModule } from '../properties/property-group/property-group.module';
import { KeyValueRowComponent } from './key-value-row/key-value-row.component';
import { IconModule } from '../icon/icon.module';
import { InputModule } from '../input/input.module';
import { SwatchModule } from '../swatch/swatch.module';
import { InputResetModule } from '../../directives/input-reset/input-reset.module';
import { ChipModule } from '../chip/chip.module';
import { CheckboxModule } from '../checkbox/checkbox.module';
import { ButtonModule } from '../button/button.module';
import { ColorInputModule } from '../input/color/color-input.module';

import {
  KeyValueWidthPipe,
  KeyValueShowColorPipe,
  KeyValueColorPipe,
  MenuForKeyPipe,
  MenuForValuePipe,
  ShowWarningPipe,
  MenuForChipPipe,
  KeyValueBindingNamePipe,
  CheckInvalidPipe,
} from './key-value.pipe';

@NgModule({
  declarations: [
    KeyValueRowComponent,
    MenuForKeyPipe,
    MenuForValuePipe,
    MenuForChipPipe,
    CheckInvalidPipe,
    ShowWarningPipe,
    KeyValueEditorNextComponent,
    KeyValueWidthPipe,
    KeyValueShowColorPipe,
    KeyValueColorPipe,
    KeyValueBindingNamePipe,
  ],
  imports: [
    CommonModule,
    ColorInputModule,
    IconModule,
    InputModule,
    PropertyGroupModule,
    SwatchModule,
    InputResetModule,
    ChipModule,
    CheckboxModule,
    ButtonModule,
  ],
  exports: [KeyValueEditorNextComponent],
})
export class KeyValueEditorModule {}
