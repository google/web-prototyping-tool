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
import { GlassLayerComponent } from './glass-layer.component';
import { InteractionLayerComponent } from './interaction-layer/interaction-layer.component';
import { HighlightLayerComponent } from './highlight-layer/highlight-layer.component';
import { SelectionLayerComponent } from './selection-layer/selection-layer.component';
import { ResizeLayerComponent } from './resize-layer/resize-layer.component';
import { GlassDefsComponent } from './glass-defs/glass-defs.component';
import { OutletFrameModule } from '../outlet-frame/outlet-frame.module';
import { InfoTextComponent } from './info-text/info-text.component';
import { StyleVisLayerComponent } from './stylevis-layer/stylevis-layer.component';
import { ActionLayerComponent } from './action-layer/action-layer.component';
import { PosLayerComponent } from './stylevis-layer/pos-layer/pos-layer.component';
import { PaddingLayerComponent } from './stylevis-layer/padding-layer/padding-layer.component';
import { GridLayerComponent } from './stylevis-layer/grid-layer/grid-layer.component';
import { BorderRadiusLayerComponent } from './stylevis-layer/border-radius-layer/border-radius-layer.component';
import { DebugCanvasLayerComponent } from './debug-canvas-layer/debug-canvas-layer.component';
import { LineLayerComponent } from './line-layer/line-layer.component';
import { ResizeEdgeDirective } from './resize-layer/resize-edge.directive';
import { ResizeBoardLayerComponent } from './resize-board-layer/resize-board-layer.component';
import { DndDirectorModule } from '../../dnd-director/dnd-director.module';
import { HighlightLabelTransform } from './highlight-layer/highlight.pipe';
import { DragLayerComponent } from './drag-layer/drag-layer.component';
import { MarqueeLayerComponent } from './marquee-layer/marquee-layer.component';
import { PeerMarqueeRectPositionPipe } from './marquee-layer/marquee.pipe';
import { ContextMenuBarModule } from './context-menu-bar/context-menu-bar.module';
import { CursorLayerModule } from './cursor-layer/cursor-layer.module';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    ContextMenuBarModule,
    CdCommonModule,
    CdCommonPipeModule,
    OutletFrameModule,
    DndDirectorModule,
    CursorLayerModule,
    PipesModule,
  ],
  declarations: [
    GlassLayerComponent,
    InteractionLayerComponent,
    HighlightLayerComponent,
    SelectionLayerComponent,
    StyleVisLayerComponent,
    ResizeLayerComponent,
    GlassDefsComponent,
    InfoTextComponent,
    DebugCanvasLayerComponent,
    ActionLayerComponent,
    PosLayerComponent,
    PaddingLayerComponent,
    GridLayerComponent,
    BorderRadiusLayerComponent,
    LineLayerComponent,
    ResizeEdgeDirective,
    ResizeBoardLayerComponent,
    HighlightLabelTransform,
    DragLayerComponent,
    MarqueeLayerComponent,
    PeerMarqueeRectPositionPipe,
  ],
  exports: [GlassLayerComponent, InfoTextComponent],
})
export class GlassModule {}
