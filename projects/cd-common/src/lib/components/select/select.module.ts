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
import { SelectItemComponent } from './select-item.component';
import { SelectComponent } from './select.component';
import { IconModule } from '../icon/icon.module';
import { OverlayModule } from '../overlay/overlay.module';
import { SwatchModule } from '../swatch/swatch.module';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { SearchInputModule } from '../search-input/search-input.module';
import { TooltipModule } from '../../directives/tooltip/tooltip.module';

@NgModule({
  declarations: [SelectItemComponent, SelectComponent],
  imports: [
    CommonModule,
    IconModule,
    OverlayModule,
    SwatchModule,
    SearchInputModule,
    CdCommonPipeModule,
    TooltipModule,
  ],
  exports: [SelectItemComponent, SelectComponent],
})
export class SelectModule {}
