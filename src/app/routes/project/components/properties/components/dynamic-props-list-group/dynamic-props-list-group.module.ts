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
import { DynamicPropsListGroupComponent } from './dynamic-props-list-group.component';
import { CdCommonModule, CdPropertiesModule } from 'cd-common';
import { DynamicPropsListComponent } from './dynamic-props-list/dynamic-props-list.component';
import { DynamicPropsListModule } from './dynamic-props-list/dynamic-props-list.module';

@NgModule({
  declarations: [DynamicPropsListGroupComponent],
  imports: [CommonModule, CdCommonModule, CdPropertiesModule, DynamicPropsListModule],
  exports: [DynamicPropsListGroupComponent, DynamicPropsListComponent],
})
export class DynamicPropsListGroupModule {}
