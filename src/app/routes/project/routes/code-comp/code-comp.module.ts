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
import { RouterModule, Routes } from '@angular/router';
import { CdCommonModule, CdPropertiesModule } from 'cd-common';
import { CodeCompComponent } from './code-comp.component';
import { CodeCompPanelComponent } from './components/code-comp-panel/code-comp-panel.component';
import { InputsPanelContentComponent } from './components/inputs-panel-content/inputs-panel-content.component';
import { InputCardComponent } from './components/input-card/input-card.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { TestPanelComponent } from './components/test-panel/test-panel.component';
import { CodeCompTopBarComponent } from './components/code-comp-top-bar/code-comp-top-bar.component';
import { EventsPanelContentComponent } from './components/events-panel-content/events-panel-content.component';
import { EventCardComponent } from './components/event-card/event-card.component';
import { RenderOutletIFrameModule } from 'src/app/components/render-outlet-iframe/render-outlet-iframe.module';
import { CODE_COMPONENT_ID_ROUTE_PARAM } from 'src/app/configs/routes.config';
import { PublishPanelModule } from 'src/app/routes/project/components/publish-panel/publish-panel.module';
import { OwnerDetailsModule } from '../../components/owner-details/owner-details.module';
import { DynamicPropertiesModule } from '../../components/properties/dynamic-properties/dynamic-properties.module';
import { CodeCompFontsComponent } from './components/code-comp-fonts/code-comp-fonts.component';
import { PresenceIndicatorsModule } from '../../components/presence-indicators/presence-indicators.module';

const ROUTES: Routes = [
  {
    path: `:${CODE_COMPONENT_ID_ROUTE_PARAM}`,
    component: CodeCompComponent,
  },
];

@NgModule({
  declarations: [
    CodeCompComponent,
    CodeCompPanelComponent,
    InputsPanelContentComponent,
    InputCardComponent,
    TestPanelComponent,
    CodeCompTopBarComponent,
    EventsPanelContentComponent,
    EventCardComponent,
    CodeCompFontsComponent,
  ],
  imports: [
    DragDropModule,
    OwnerDetailsModule,
    CommonModule,
    CdPropertiesModule,
    CdCommonModule,
    CdCommonPipeModule,
    DynamicPropertiesModule,
    PublishPanelModule,
    RenderOutletIFrameModule,
    PresenceIndicatorsModule,
    RouterModule.forChild(ROUTES),
  ],
  providers: [],
})
export class CodeCompModule {}
