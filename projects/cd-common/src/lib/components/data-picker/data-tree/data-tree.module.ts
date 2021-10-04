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
import { DataTreeComponent } from './data-tree.component';
import { DataIndentPipe } from '../data-picker.pipe';
import { IconModule } from '../../icon/icon.module';
import { ButtonModule } from '../../button/button.module';
import { TooltipModule } from '../../../directives/tooltip/tooltip.module';
import { SearchInputModule } from '../../search-input/search-input.module';

@NgModule({
  declarations: [DataTreeComponent, DataIndentPipe],
  imports: [CommonModule, SearchInputModule, IconModule, ButtonModule, TooltipModule],
  exports: [DataTreeComponent],
})
export class DataTreeModule {}
