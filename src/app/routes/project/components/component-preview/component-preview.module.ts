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
import { ComponentPreviewModalComponent } from './component-preview-modal.component';
import { CdCommonModule } from 'cd-common';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { RenderOutletIFrameModule } from 'src/app/components/render-outlet-iframe/render-outlet-iframe.module';
import { ComponentPreviewPipe } from './component-preview.pipe';
import { PublishDetailsModule } from '../publish-details/publish-details.module';

@NgModule({
  declarations: [ComponentPreviewModalComponent, ComponentPreviewPipe],
  imports: [
    CommonModule,
    CdCommonModule,
    CdCommonPipeModule,
    RenderOutletIFrameModule,
    PublishDetailsModule,
  ],
})
export class ComponentPreviewModule {}
