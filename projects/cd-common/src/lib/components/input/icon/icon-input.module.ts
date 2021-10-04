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
import { IconInputComponent } from './icon-input.component';
import { IconModule } from '../../icon/icon.module';
import { InputModule } from '../input.module';
import { SelectInputModule } from '../select-input/select-input.module';
import { TooltipModule } from '../../../directives/tooltip/tooltip.module';
import { IconNameFormatPipe, MatIconClassNamePipe } from './icon.pipe';
import { ButtonModule } from '../../button/button.module';
import { ChipModule } from '../../chip/chip.module';

@NgModule({
  declarations: [IconInputComponent, IconNameFormatPipe, MatIconClassNamePipe],
  imports: [
    IconModule,
    InputModule,
    ChipModule,
    CommonModule,
    SelectInputModule,
    ButtonModule,
    TooltipModule,
  ],
  exports: [IconInputComponent, MatIconClassNamePipe],
})
export class IconInputModule {}
