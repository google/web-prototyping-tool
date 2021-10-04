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
import { LayoutEngineDemoComponent } from './layout-engine-demo.component';
import { LayoutPreviewComponent } from './layout-preview.component';
import { LayoutEngineModule } from 'src/app/routes/project/components/layout-engine/layout-engine.module';
import { CdCommonModule, CdPropertiesModule } from 'cd-common';
import { CdDirectiveModule } from 'cd-common/directives';
import { LegacyLayoutPropsModule } from './legacy-layout-props/layout-props.module';

@NgModule({
  declarations: [LayoutEngineDemoComponent, LayoutPreviewComponent],
  imports: [
    CommonModule,
    CdCommonModule,
    LegacyLayoutPropsModule,
    CdPropertiesModule,
    LayoutEngineModule,
    CdDirectiveModule,
  ],
})
export class LayoutEngineModuleDemo {}
