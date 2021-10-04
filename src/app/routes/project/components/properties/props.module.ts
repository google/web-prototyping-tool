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
import { CdCommonModule, CdPropertiesModule } from 'cd-common';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { PropertiesPanelComponent } from './properties-panel.component';
import { SymbolIsolationPropertiesComponent } from './symbol-isolation-properties/symbol-isolation-properties.component';
import { RouterModule } from '@angular/router';
import { PropertyComponentsModule } from './components/property-components.module';
import { OwnerDetailsModule } from '../owner-details/owner-details.module';
import { ActionsPanelModule } from './actions-panel/actions-panel.module';
import { PublishPanelModule } from '../publish-panel/publish-panel.module';
import { DynamicPropertiesModule } from './dynamic-properties/dynamic-properties.module';
import { DynamicPropsListGroupModule } from './components/dynamic-props-list-group/dynamic-props-list-group.module';
import { DynamicPropsModalModule } from './dynamic-props-modal/dynamic-props-modal.module';
import { TableColumnPropsModule } from './components/table-column-props/table-column-props.module';
import { AccessibilityPropsModule } from './accessibility/accessibility-props.module';
import { ProjectPropertiesModule } from './project-properties/project-properties.module';

@NgModule({
  declarations: [SymbolIsolationPropertiesComponent, PropertiesPanelComponent],
  imports: [
    CommonModule,
    CdPropertiesModule,
    AccessibilityPropsModule,
    DynamicPropertiesModule,
    DynamicPropsListGroupModule,
    ProjectPropertiesModule,
    DynamicPropsModalModule,
    OwnerDetailsModule,
    TableColumnPropsModule,
    ActionsPanelModule,
    CdCommonModule,
    CdCommonPipeModule,
    RouterModule,
    PublishPanelModule,
    PropertyComponentsModule,
  ],
  exports: [PropertiesPanelComponent],
})
export class PropsModule {}
