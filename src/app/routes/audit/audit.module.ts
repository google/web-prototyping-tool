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
import { Routes, RouterModule } from '@angular/router';

import { AuditComponent } from './audit.component';
import { CdCommonModule } from 'cd-common';
import { RenderOutletIFrameModule } from '../../components/render-outlet-iframe/render-outlet-iframe.module';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { registerComponentDefinitions } from 'cd-definitions';

const ROUTES: Routes = [
  {
    path: '',
    component: AuditComponent,
  },
];

@NgModule({
  declarations: [AuditComponent],
  imports: [
    CommonModule,
    CdCommonModule,
    CdCommonPipeModule,
    RenderOutletIFrameModule,
    RouterModule.forChild(ROUTES),
  ],
})
export class AuditModule {
  constructor() {
    // Load all built-in component definitions - this will enable the audit component to build up
    // the board that contains the components being audited
    registerComponentDefinitions();
  }
}
