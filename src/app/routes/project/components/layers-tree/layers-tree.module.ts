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
import { CdCommonModule, TreeCellModule } from 'cd-common';
import { LayersTreeComponent } from './layers-tree.component';
import { LayersTreeService } from '../../services/layers-tree/layers-tree.service';
import { DndDirectorModule } from '../../dnd-director/dnd-director.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  TreeItemIsBoard,
  TreeItemIsSymbol,
  TreeItemINotBoard,
  TreeNodeInMapOrSet,
  TreeNodeInArray,
} from './layers-tree.pipe';

@NgModule({
  declarations: [
    LayersTreeComponent,
    TreeItemIsBoard,
    TreeItemIsSymbol,
    TreeItemINotBoard,
    TreeNodeInArray,
    TreeNodeInMapOrSet,
  ],
  imports: [CommonModule, CdCommonModule, TreeCellModule, ScrollingModule, DndDirectorModule],
  exports: [LayersTreeComponent],
  providers: [LayersTreeService],
})
export class LayersTreeModule {}
