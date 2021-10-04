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
import { ColorInputModule } from '../../input/color/color-input.module';
import { IconInputModule } from '../../input/icon/icon-input.module';
import { IconPropsComponent } from './icon-props.component';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { InputGroupModule } from '../../input-group/input-group.module';
import { InputModule } from '../../input/input.module';
import { RangeModule } from '../../input/range/range.module';
import { SelectInputModule } from '../../input/select-input/select-input.module';
import { SelectModule } from '../../select/select.module';

@NgModule({
  declarations: [IconPropsComponent],
  imports: [
    ColorInputModule,
    CommonModule,
    IconInputModule,
    InputGroupModule,
    InputModule,
    RangeModule,
    SelectInputModule,
    SelectModule,
    CdCommonPipeModule,
  ],
  exports: [IconPropsComponent],
})
export class IconPropsModule {}
