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
import { InputComponent, InputLeftDirective } from './input.component';
import { InputStepperComponent } from './input-stepper/input-stepper.component';
import { InputResetModule } from '../../directives/input-reset/input-reset.module';
import { IconModule } from '../icon/icon.module';
import { MenuWrapperModule } from '../menu-wrapper/menu-wrapper.module';
import { InputUnitPipe, InputValuePipe } from './input.pipe';
import { InputAutoCompleteDirective } from './input.directive';
import { TooltipModule } from '../../directives/tooltip/tooltip.module';
import { DragRangeDirective } from './drag-range.directive';

@NgModule({
  declarations: [
    InputComponent,
    InputStepperComponent,
    InputUnitPipe,
    InputValuePipe,
    InputLeftDirective,
    InputAutoCompleteDirective,
    DragRangeDirective,
  ],
  imports: [CommonModule, InputResetModule, IconModule, MenuWrapperModule, TooltipModule],
  exports: [InputComponent, InputLeftDirective, InputAutoCompleteDirective],
})
export class InputModule {}
