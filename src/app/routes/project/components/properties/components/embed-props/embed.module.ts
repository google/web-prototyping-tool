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
import { EmbedPropsComponent } from './embed-props.component';
import { YoutubePropsComponent } from './youtube-embed-props/youtube-props.component';
import { MapPropsComponent } from './map-embed-props/map-props.component';
import { CdCommonModule } from 'cd-common';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { FigmaPropsComponent } from './figma-embed-props/figma-props.component';
import { DocsEmbedPropsComponent } from './docs-embed-props/docs-embed-props.component';
import { SheetsEmbedPropsComponent } from './sheets-embed-props/sheets-embed-props.component';
import { SlidesEmbedPropsComponent } from './slides-embed-props/slides-embed-props.component';

@NgModule({
  declarations: [
    EmbedPropsComponent,
    YoutubePropsComponent,
    MapPropsComponent,
    FigmaPropsComponent,
    DocsEmbedPropsComponent,
    SheetsEmbedPropsComponent,
    SlidesEmbedPropsComponent,
  ],
  imports: [CommonModule, CdCommonModule, CdCommonPipeModule],
  exports: [EmbedPropsComponent],
})
export class EmbedPropsModule {}
