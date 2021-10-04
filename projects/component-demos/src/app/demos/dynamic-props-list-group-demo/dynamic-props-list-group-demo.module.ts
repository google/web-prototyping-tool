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

import { NgModule, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicPropsListGroupDemoComponent } from './dynamic-props-list-group-demo.component';
import { DynamicPropsListGroupModule } from 'src/app/routes/project/components/properties/components/dynamic-props-list-group/dynamic-props-list-group.module';
import { CdCommonModule } from 'cd-common';
import { StoreModule } from '@ngrx/store';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { FIREBASE_OPTIONS } from '@angular/fire';
import { environment } from 'src/environments/environment';
import { ErrorService } from 'src/app/services/error/error.service';
import { DynamicPropsModalModule } from 'src/app/routes/project/components/properties/dynamic-props-modal/dynamic-props-modal.module';

const providers: Provider[] = [
  AnalyticsService,
  { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
  ErrorService,
];

@NgModule({
  declarations: [DynamicPropsListGroupDemoComponent],
  imports: [
    CommonModule,
    CdCommonModule,
    DynamicPropsListGroupModule,
    DynamicPropsModalModule,
    StoreModule.forRoot({}),
  ],
  exports: [DynamicPropsListGroupDemoComponent],
  providers,
})
export class DynamicPropsListGroupDemoModule {}
