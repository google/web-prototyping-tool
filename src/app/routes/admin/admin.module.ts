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
import { AdminComponent } from './admin.component';
import { Routes, RouterModule } from '@angular/router';
import { CdCommonModule, CdPropertiesModule, PropertyGroupModule } from 'cd-common';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { BannerEditorComponent } from './components/banner-editor/banner-editor.component';
import { ChangelogEditorComponent } from './components/changelog-editor/changelog-editor.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { AuthedUserDetailsComponent } from './components/authed-user-details/authed-user-details.component';

const ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: ':pageId',
    children: [
      {
        path: '',
        component: AdminComponent,
      },
    ],
  },
];

@NgModule({
  declarations: [
    AdminComponent,
    BannerEditorComponent,
    ChangelogEditorComponent,
    AnalyticsComponent,
    AuthedUserDetailsComponent,
  ],
  imports: [
    RouterModule.forChild(ROUTES),
    CommonModule,
    CdCommonModule,
    PropertyGroupModule,
    CdPropertiesModule,
    CdCommonPipeModule,
  ],
})
export class AdminModule {}
