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
import { AssetsPanelComponent } from './assets-panel.component';
import { CdCommonModule } from 'cd-common';
import { ActivityPanelHeaderModule } from '../../panel-header/activity-panel-header.module';
import { ImageAssetsTileComponent } from './image-assets-tile/image-assets-tile.component';
import { DndDirectorModule } from '../../../dnd-director/dnd-director.module';
import { SearchbarModule } from '../components/searchbar/searchbar.module';
import { CdCommonPipeModule } from 'cd-common/pipes';

@NgModule({
  declarations: [AssetsPanelComponent, ImageAssetsTileComponent],
  imports: [
    CommonModule,
    CdCommonModule,
    ActivityPanelHeaderModule,
    SearchbarModule,
    DndDirectorModule,
    CdCommonPipeModule,
  ],
  exports: [AssetsPanelComponent],
})
export class AssetsPanelModule {}
