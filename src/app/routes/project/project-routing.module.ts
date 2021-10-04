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
import { Routes, RouterModule } from '@angular/router';
import { ProjectComponent } from './project.component';
import { Route } from 'src/app/configs/routes.config';
import { FirebaseField } from 'cd-common/consts';
import * as editorGuards from './guards';

const ROUTES: Routes = [
  {
    path: `:${FirebaseField.ProjectId}`,
    // canActivateChild: [editorGuards.ProjectGuard],
    children: [
      {
        path: '',
        component: ProjectComponent,
        canActivate: [editorGuards.ProjectGuard],
      },
      {
        path: Route.Preview,
        loadChildren: () => import('./routes/preview/preview.module').then((m) => m.PreviewModule),
      },
      {
        path: Route.Embed,
        loadChildren: () => import('./routes/embed/embed.module').then((m) => m.EmbedModule),
      },
      {
        path: Route.CodeComponent,
        loadChildren: () =>
          import('./routes/code-comp/code-comp.module').then((m) => m.CodeCompModule),
        canActivate: [editorGuards.ProjectGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  exports: [RouterModule],
  providers: [...editorGuards.guards],
})
export class ProjectRoutingModule {}
