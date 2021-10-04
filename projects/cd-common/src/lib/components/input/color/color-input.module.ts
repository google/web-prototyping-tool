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
import { ColorInputComponent } from './color-input.component';
import { ChipModule } from '../../chip/chip.module';
import { InputModule } from '../input.module';
import { SwatchModule } from '../../swatch/swatch.module';
import { TooltipModule } from '../../../directives/tooltip/tooltip.module';
import { SelectInputModule } from '../select-input/select-input.module';
import { ColorAlphaPipe } from './color-alpha.pipe';
import { ColorPickerModule } from '../../color-picker/color-picker.module';
import { ColorPickerDirective } from './picker.directive';

@NgModule({
  declarations: [ColorInputComponent, ColorPickerDirective, ColorAlphaPipe],
  imports: [
    CommonModule,
    ChipModule,
    ColorPickerModule,
    SelectInputModule,
    InputModule,
    SwatchModule,
    TooltipModule,
  ],
  exports: [ColorInputComponent, ColorPickerDirective],
})
export class ColorInputModule {}
