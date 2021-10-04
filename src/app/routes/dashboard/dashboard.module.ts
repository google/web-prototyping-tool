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
import { Routes, RouterModule } from '@angular/router';
import { CdCommonModule } from 'cd-common';
import { DashboardComponent } from './dashboard.component';
import { EmptyMessageComponent } from './components/empty-message/empty-message.component';
import { CreateProjectPickerComponent } from './components/create-project-picker/create-project-picker.component';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { ProjectsTabComponent } from './components/projects-tab/projects-tab.component';
import { TemplateDetailsComponent } from './components/template-details/template-details.component';
import { ProjectTileComponent } from './components/project-tile/project-tile.component';
import { ProjectTilePreviewComponent } from './components/project-tile-preview/project-tile-preview.component';
import { EffectsModule } from '@ngrx/effects';
import { effects } from './store';
import { ProjectThumbnailPipe } from './dashboard.pipe';
import { TemplateTileComponent } from './components/template-tile/template-tile.component';
import { ImageCarouselModule } from './components/image-carousel/image-carousel.module';

const ROUTES: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(ROUTES),
    EffectsModule.forFeature(effects),
    CommonModule,
    CdCommonModule,
    ImageCarouselModule,
    CdCommonPipeModule,
  ],
  declarations: [
    ProjectThumbnailPipe,
    DashboardComponent,
    ProjectTileComponent,
    ProjectTilePreviewComponent,
    EmptyMessageComponent,
    CreateProjectPickerComponent,
    ProjectsTabComponent,
    TemplateTileComponent,
    TemplateDetailsComponent,
  ],
})
export class DashboardModule {}
