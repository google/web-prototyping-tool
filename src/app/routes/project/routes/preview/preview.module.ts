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
import { PreviewComponent } from './preview.component';
import { Route } from 'src/app/configs/routes.config';
import { Routes, RouterModule } from '@angular/router';
import * as previewGaurds from './guards';
import { CdCommonModule } from 'cd-common';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { RenderOutletIFrameModule } from 'src/app/components/render-outlet-iframe/render-outlet-iframe.module';
import { PreviewTopBarModule } from './components/preview-top-bar/preview-top-bar.module';
import { PreviewOutletListComponent } from './components/preview-outlet-list/preview-outlet-list.component';
import { PreviewCommentsModule } from './components/preview-comments/preview-comments.module';
import { PipesModule } from '../../pipes/pipes.module';
import { PreviewCanvasComponent } from './components/preview-canvas/preview-canvas.component';
import { PreviewGlassLayerComponent } from './components/preview-canvas/preview-glass-layer/preview-glass-layer.component';
import { AccessibilityReportModule } from './components/accessibility-report/accessibility-report.module';
import { GlassModule } from '../../components/glass-layer/glass.module';
import { PreviewGreenlineDirective } from './components/preview-canvas/preview-glass-layer/preview-greenline/preview-greenline.directive';
import { PreviewLeftbarComponent } from './components/preview-leftbar/preview-leftbar.component';
import { A11yInspectorOverlayComponent } from './components/a11y-inspector-overlay/a11y-inspector-overlay.component';
import { EmbedBadgeModule } from './components/embed-badge/embed-badge.module';
import {
  ElementLabelTransformPipe,
  ElementHasA11yPipe,
  ElementNamePipe,
  BubbleLabelOffsetPipe,
  OverlayMaskBackgroundPipe,
} from './components/preview-canvas/preview-glass-layer/preview-glass-layer.pipe';
import { PresenceIndicatorsModule } from '../../components/presence-indicators/presence-indicators.module';

const ROUTES: Routes = [
  {
    path: Route.Default,
    component: PreviewComponent,
    canActivate: [previewGaurds.PreviewGuard],
  },
];

@NgModule({
  imports: [
    CommonModule,
    CdCommonModule,
    CdCommonPipeModule,
    PipesModule,
    AccessibilityReportModule,
    PreviewCommentsModule,
    PreviewTopBarModule,
    EmbedBadgeModule,
    RenderOutletIFrameModule,
    PresenceIndicatorsModule,
    RouterModule.forChild(ROUTES),
    GlassModule,
  ],
  declarations: [
    PreviewComponent,
    PreviewOutletListComponent,
    PreviewCanvasComponent,
    PreviewGlassLayerComponent,
    PreviewGreenlineDirective,
    A11yInspectorOverlayComponent,
    ElementLabelTransformPipe,
    ElementHasA11yPipe,
    ElementNamePipe,
    BubbleLabelOffsetPipe,
    OverlayMaskBackgroundPipe,
    PreviewLeftbarComponent,
  ],
  providers: [...previewGaurds.guards],
})
export class PreviewModule {}
