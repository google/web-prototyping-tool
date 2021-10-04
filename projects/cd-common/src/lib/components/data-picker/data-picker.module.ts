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
import { DataPickerComponent } from './data-picker.component';
import { IconModule } from '../icon/icon.module';
import { ButtonModule } from '../button/button.module';
import { TooltipModule } from '../../directives/tooltip/tooltip.module';
import { DataViewerComponent } from './data-viewer/data-viewer.component';
import { DataHeaderComponent } from './data-header/data-header.component';
import { DataTreeModule } from './data-tree/data-tree.module';
import { ScrollViewModule } from '../scroll-view/scroll-view.module';
import { DataPickerDirective } from './data-picker.directive';
import { ValidIconModule } from '../valid-icon/valid-icon.module';
import {
  DataPickerPipe,
  FormatSelectedValueForDataPipe,
  ActiveDataSourcePipe,
} from './data-picker.pipe';
import { DataWarningComponent } from './data-warning/data-warning.component';

@NgModule({
  declarations: [
    DataPickerComponent,
    FormatSelectedValueForDataPipe,
    ActiveDataSourcePipe,
    DataViewerComponent,
    DataHeaderComponent,
    DataPickerPipe,
    DataPickerDirective,
    DataWarningComponent,
  ],
  imports: [
    CommonModule,
    ValidIconModule,
    IconModule,
    ButtonModule,
    TooltipModule,
    ScrollViewModule,
    DataTreeModule,
  ],
  exports: [DataPickerComponent, DataPickerDirective, DataTreeModule],
})
export class DataPickerModule {}
