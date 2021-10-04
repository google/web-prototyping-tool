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
import { CdCommonModule } from 'cd-common';
import { ActivityPanelHeaderModule } from '../../panel-header/activity-panel-header.module';
import { ComponentsPanelComponent } from './components-panel.component';
import { SearchbarModule } from '../components/searchbar/searchbar.module';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { FilterByLibraryPipe } from './components-panel.pipe';
import { CodeComponentsModalComponent } from './code-components-modal/code-components-modal.component';
import { DndDirectorModule } from '../../../dnd-director/dnd-director.module';
import { ComponentTileComponent } from './component-tile/component-tile.component';
import { ComponentFilterComponent } from './component-filter/component-filter.component';
import { ComponentPreviewModule } from '../../component-preview/component-preview.module';

@NgModule({
  declarations: [
    ComponentsPanelComponent,
    FilterByLibraryPipe,
    CodeComponentsModalComponent,
    ComponentTileComponent,
    ComponentFilterComponent,
  ],
  imports: [
    CommonModule,
    CdCommonModule,
    ComponentPreviewModule,
    ActivityPanelHeaderModule,
    SearchbarModule,
    DndDirectorModule,
    CdCommonPipeModule,
  ],
  exports: [ComponentsPanelComponent],
})
export class ComponentsPanelModule {}
