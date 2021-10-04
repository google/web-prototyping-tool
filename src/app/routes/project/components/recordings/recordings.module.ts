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
import { RecordListComponent } from './record-list/record-list.component';
import { CdCommonModule } from 'cd-common';
import { RecordingsComponent } from './recordings.component';
import {
  RecordedLabelPipe,
  RecordedTitlePipe,
  RecordedTimingAppliedPipe,
  RecordTimingTooltipPipe,
  RecordedDurationPipe,
  RecordedDelayPipe,
  RecordeOutputPipe,
  RecordedInputTypePipe,
  RecordedInputMenuPipe,
} from './record-list/record-list.pipe';
import { RecordTimingOverlayComponent } from './record-timing-overlay/record-timing-overlay.component';
import { MarkSelectedPipeModule } from 'cd-common/pipes';
import { PropertiesPipeModule } from '../properties/properties-pipe.module';

@NgModule({
  declarations: [
    RecordListComponent,
    RecordingsComponent,
    RecordedLabelPipe,
    RecordedTitlePipe,
    RecordedInputTypePipe,
    RecordedInputMenuPipe,
    RecordedTimingAppliedPipe,
    RecordedDurationPipe,
    RecordeOutputPipe,
    RecordedDelayPipe,
    RecordTimingTooltipPipe,
    RecordTimingOverlayComponent,
  ],
  imports: [CommonModule, CdCommonModule, PropertiesPipeModule, MarkSelectedPipeModule],
  exports: [RecordListComponent, RecordingsComponent],
})
export class RecordModule {}
