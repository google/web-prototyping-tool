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
import { BorderInputComponent } from './border-input.component';
import { SwatchModule } from '../../swatch/swatch.module';
import { SelectWrapperModule } from '../select-wrapper/select-wrapper.module';
import { InputModule } from '../input.module';
import { SelectModule } from '../../select/select.module';
import { SelectInputModule } from '../select-input/select-input.module';
import { ColorInputModule } from '../color/color-input.module';
import { CdCommonPipeModule } from 'cd-common/pipes';

@NgModule({
  declarations: [BorderInputComponent],
  imports: [
    ColorInputModule,
    SwatchModule,
    SelectWrapperModule,
    InputModule,
    SelectModule,
    SelectInputModule,
    CdCommonPipeModule,
  ],
  exports: [BorderInputComponent],
})
export class BorderInputModule {}
