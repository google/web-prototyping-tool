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
import { Store, select } from '@ngrx/store';
import { Observable, of } from 'rxjs';

import { tap, map, take, switchMap } from 'rxjs/operators';
import * as projectStoreModule from '../../store';
import { IProjectDataState } from '../../store/reducers/project-data.reducer';
import { environment } from 'src/environments/environment';

@Injectable()
export class ProjectGuard implements CanActivate, CanActivateChild {
  constructor(private store: Store<projectStoreModule.IProjectState>) {}

  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    return this.checkStore();
  }

  canActivateChild(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkStore();
  }

  checkStore(): Observable<boolean> {
    return this.store.pipe(
      select(projectStoreModule.getProjectDataState),
      tap((projectData: IProjectDataState) => {
        if (!projectData.projectDataLoaded && !environment.e2e) {
          this.store.dispatch(new projectStoreModule.ProjectDataQuery());
        }
      }),
      map((projectData) => projectData.projectDataLoaded),
      // filter(loaded => loaded),
      take(1),
      switchMap(() => of(true))
    );
  }
}
