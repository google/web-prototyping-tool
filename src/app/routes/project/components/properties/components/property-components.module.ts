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
import { ImageCropPropsComponent } from './image-crop-props/image-crop-props.component';
import { ImageFilterPropsComponent } from './image-filter-props/image-filter-props.component';
import { ImageSizeComponent } from './image-size-props/image-size.component';
import { ImageSourcePropsComponent } from './image-source-props/image-source-props.component';
import { ShadowGroupComponent } from './shadow-group/shadow-group.component';
import { BorderRadiusPropsComponent } from './border-radius-props/border-radius-props.component';
import { PaddingPropsComponent } from './padding-props/padding-props.component';
import { BorderGroupComponent } from './border-group/border-group.component';
import { BoardBkdPropsComponent } from './board-bkd-props/board-bkd-props.component';
import { GenericPropsGroupModule } from './generic-props-group/generic-props-group.module';
import { CdCommonModule, CdPropertiesModule } from 'cd-common';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { DatePropsComponent } from './date-props/date-props.component';
import { PortalListPropsComponent } from './portal-list-props/portal-list-props.component';
import { EmbedPropsModule } from './embed-props/embed.module';
import { DynamicPropsListGroupModule } from './dynamic-props-list-group/dynamic-props-list-group.module';
import { CheckboxListComponent } from './checkbox-list/checkbox-list.component';
import { OverflowPropsComponent } from './overflow-props/overflow-props.component';

@NgModule({
  declarations: [
    BoardBkdPropsComponent,
    BorderGroupComponent,
    BorderRadiusPropsComponent,
    DatePropsComponent,
    ImageCropPropsComponent,
    ImageFilterPropsComponent,
    ImageSizeComponent,
    ImageSourcePropsComponent,
    PaddingPropsComponent,
    PortalListPropsComponent,
    ShadowGroupComponent,
    CheckboxListComponent,
    OverflowPropsComponent,
  ],
  exports: [
    BoardBkdPropsComponent,
    BorderGroupComponent,
    BorderRadiusPropsComponent,
    DatePropsComponent,
    DynamicPropsListGroupModule,
    GenericPropsGroupModule,
    ImageCropPropsComponent,
    ImageFilterPropsComponent,
    EmbedPropsModule,
    ImageSizeComponent,
    ImageSourcePropsComponent,
    PaddingPropsComponent,
    CheckboxListComponent,
    PortalListPropsComponent,
    OverflowPropsComponent,
    ShadowGroupComponent,
  ],
  imports: [
    CommonModule,
    CdCommonModule,
    CdPropertiesModule,
    CdCommonPipeModule,
    GenericPropsGroupModule,
  ],
})
export class PropertyComponentsModule {}
