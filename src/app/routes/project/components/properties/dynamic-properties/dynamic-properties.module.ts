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

import { GenericPropsGroupModule } from '../components/generic-props-group/generic-props-group.module';
import { PropertyComponentsModule } from '../components/property-components.module';
import { DynamicPropertiesComponent } from './dynamic-properties.component';
import { ThemeOptionsPipe } from '../theme-options.pipe';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CdCommonModule, CdPropertiesModule } from 'cd-common';
import { TableColumnPropsModule } from '../components/table-column-props/table-column-props.module';
import { AutoNavItemDestinationPropComponent } from '../components/auto-nav-item-destination-prop/auto-nav-item-destination-prop.component';
import { PositionPropsModule } from '../components/position-props/position-props.module';
import { DynamicGroupCollapsedDirective } from './group-collapse.directive';
import { LayoutEngineModule } from '../../layout-engine/layout-engine.module';
import { PropertiesPipeModule } from '../properties-pipe.module';

@NgModule({
  declarations: [
    ThemeOptionsPipe,
    DynamicPropertiesComponent,
    AutoNavItemDestinationPropComponent,
    DynamicGroupCollapsedDirective,
  ],
  imports: [
    PropertiesPipeModule,
    CdCommonModule,
    CdPropertiesModule,
    LayoutEngineModule,
    GenericPropsGroupModule,
    PropertyComponentsModule,
    TableColumnPropsModule,
    PositionPropsModule,
    CdCommonPipeModule,
    CommonModule,
  ],
  exports: [DynamicPropertiesComponent, AutoNavItemDestinationPropComponent],
})
export class DynamicPropertiesModule {}
