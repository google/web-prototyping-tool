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
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { PROJECT_ID_ROUTE_PARAM } from 'src/app/configs/routes.config';
import { ProjectGuard } from '../../../../guards';

@Injectable()
export class PreviewGuard implements CanActivate {
  constructor(private projectGuard: ProjectGuard) {}

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    const projectId = route.params[PROJECT_ID_ROUTE_PARAM];
    const checks$ = forkJoin([this.projectGuard.projectOpened(projectId)]).pipe(
      map(this.combineAllChecks),
      take(1)
    );

    return checks$;
  }

  combineAllChecks(checks: boolean[]): boolean {
    return !!checks.indexOf(false);
  }
}
