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

import { Action } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';
import * as actions from '../actions/project.action';
import * as cd from 'cd-interfaces';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';
import { ProjectChangeCoordinator } from 'src/app/database/changes/project-change.coordinator';

@Injectable()
export class DashboardEffects {
  constructor(
    private actions$: Actions,
    private _databaseChangesService: DatabaseChangesService,
    private _projectChangeCoordiantor: ProjectChangeCoordinator
  ) {}

  create$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<actions.ProjectCreate>(actions.PROJECT_CREATE),
        tap((action) => {
          this._projectChangeCoordiantor.createAndOpenNewProject(action.themeId);
        })
      ),
    { dispatch: false }
  );

  update$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ProjectUpdate>(actions.PROJECT_UPDATE),
      map((action) => action),
      switchMap(({ id, changes }) => {
        return from(this._databaseChangesService.updateProject(id, changes));
      }),
      map(() => new actions.ProjectUpdateSuccess())
    )
  );

  delete$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ProjectDelete>(actions.PROJECT_DELETE),
      map((action) => action.payload),
      switchMap(({ id }: cd.IProject) => from(this._databaseChangesService.deleteProject(id))),
      map(() => new actions.ProjectDeleteSuccess()),
      catchError(() => of(new actions.ProjectDeleteFailure()))
    )
  );
}
