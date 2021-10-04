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
import { CdCommonPipeModule } from 'cd-common/pipes';
import { AssetsImporterComponent } from './assets-importer.component';
import { AssetPickerTileModule } from '../asset-picker-tile/asset-picker-tile.module';
import {
  AssetCountPipe,
  AssetSelectionCountLabelPipe,
  AssetSectionFilter,
} from './asset-importer.pipe';

@NgModule({
  declarations: [
    AssetsImporterComponent,
    AssetCountPipe,
    AssetSelectionCountLabelPipe,
    AssetSectionFilter,
  ],
  imports: [CommonModule, CdCommonModule, CdCommonPipeModule, AssetPickerTileModule],
  exports: [AssetsImporterComponent],
})
export class AssetsImporterModule {}
