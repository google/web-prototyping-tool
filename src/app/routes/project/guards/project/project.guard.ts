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

import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivateChild,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { ProjectChangeCoordinator } from 'src/app/database/changes/project-change.coordinator';
import { PROJECT_ID_ROUTE_PARAM } from 'src/app/configs/routes.config';

@Injectable()
export class ProjectGuard implements CanActivate, CanActivateChild {
  constructor(private projectChangeCoordinator: ProjectChangeCoordinator) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    _routerState: RouterStateSnapshot
  ): Observable<boolean> {
    const projectId = route.params[PROJECT_ID_ROUTE_PARAM];
    return this.projectOpened(projectId);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean> {
    const projectId = route.params[PROJECT_ID_ROUTE_PARAM];
    return this.projectOpened(projectId);
  }

  projectOpened(projectId?: string): Observable<boolean> {
    if (!projectId) return of(false);
    return this.projectChangeCoordinator.openProject(projectId);
  }
}
