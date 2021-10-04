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
import { RoutePath, Route } from './configs/routes.config';
import {
  RouterStateSerializer,
  StoreRouterConnectingModule,
  DefaultRouterStateSerializer,
} from '@ngrx/router-store';
import { reducers, metaReducers, effects, CustomSerializer } from './store';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import * as appGuards from './guards';
// Note: Routes decorator must be string literals (const enum)
// Attempting to construct variables in the following will break AOT
const ROUTES: Routes = [
  {
    path: Route.Default,
    redirectTo: RoutePath.Dashboard,
    pathMatch: 'full',
  },
  {
    path: Route.Dashboard,
    canActivate: [appGuards.AuthGuard, appGuards.MaintenanceGuard],
    loadChildren: () =>
      import('./routes/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: Route.Project,
    canActivate: [appGuards.AuthGuard, appGuards.MaintenanceGuard],
    loadChildren: () => import('./routes/project/project.module').then((m) => m.ProjectModule),
  },
  {
    path: Route.Admin,
    canActivate: [appGuards.AdminGuard],
    loadChildren: () => import('./routes/admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: Route.Audit,
    canActivate: [appGuards.AuthGuard],
    loadChildren: () => import('./routes/audit/audit.module').then((m) => m.AuditModule),
  },
  {
    path: Route.VisualRegression,
    canActivate: [appGuards.AdminGuard],
    loadChildren: () =>
      import('./routes/visual-regression/visual-regression.module').then(
        (m) => m.VisualRegressionModule
      ),
  },
  {
    path: Route.CloudAssets,
    canActivate: [appGuards.AuthGuard],
    loadChildren: () =>
      import('./routes/cloud-assets/cloud-assets.module').then((m) => m.CloudAssetsModule),
  },
  {
    path: Route.ProjectNotFound,
    loadChildren: () =>
      import('./routes/project-not-found/project-not-found.module').then(
        (m) => m.ProjectNotFoundModule
      ),
  },
  {
    path: Route.SignIn,
    loadChildren: () => import('./routes/sign-in/sign-in.module').then((m) => m.SignInModule),
  },
  {
    path: Route.MaintenanceMode,
    loadChildren: () =>
      import('./routes/maintenance/maintenance.module').then((m) => m.MaintenanceModule),
  },
  {
    path: Route.WildCard,
    loadChildren: () => import('./routes/not-found/not-found.module').then((m) => m.NotFoundModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(ROUTES),
    StoreRouterConnectingModule.forRoot({
      serializer: DefaultRouterStateSerializer,
      stateKey: 'router',
    }),
    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictActionWithinNgZone: true,
        strictStateImmutability: true,
        strictActionImmutability: true,
        strictStateSerializability: false,
        strictActionSerializability: false,
      },
    }),
    EffectsModule.forRoot(effects),
  ],
  exports: [RouterModule],
  providers: [{ provide: RouterStateSerializer, useClass: CustomSerializer }, ...appGuards.guards],
})
export class AppRoutingModule {}
