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
import { constructProjectPath } from 'src/app/utils/route.utils';
import { DesignSystemService } from 'src/app/routes/project/services/design-system/design-system.service';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { map, switchMap, take, catchError, retry } from 'rxjs/operators';
import { EMPTY, forkJoin, from, Observable, of } from 'rxjs';
import { ROUTER_NAVIGATED, RouterNavigatedAction } from '@ngrx/router-store';
import * as appActions from 'src/app/store/actions';
import * as projectActions from '../../../project/store/actions';
import * as actions from '../actions/project.action';
import * as cd from 'cd-interfaces';
import { RETRY_ATTEMPTS } from 'src/app/database/database.utils';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ToastsService } from 'src/app/services/toasts/toasts.service';
import { DatabaseChangesService } from 'src/app/database/changes/database-change.service';

const PROJECT_CREATE_FAILURE_MESSAGE = 'Failed to create project';

@Injectable()
export class DashboardEffects {
  constructor(
    private actions$: Actions,
    private _designSystemService: DesignSystemService,
    private _analyticsService: AnalyticsService,
    private _toastService: ToastsService,
    private _databaseChangesService: DatabaseChangesService
  ) {}

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ProjectCreate>(actions.PROJECT_CREATE),
      switchMap((action) => {
        const project$ = from(this._databaseChangesService.createProject());
        return forkJoin([project$, of(action.themeId)]);
      }),
      switchMap(([newProject, themeId]) => {
        const projectRoutePath = constructProjectPath(newProject.id);
        return [
          new appActions.AppGo({ path: [projectRoutePath] }),
          new actions.ProjectCreateSuccess(newProject, themeId),
        ];
      }),
      retry(RETRY_ATTEMPTS),
      catchError((e) => this.handleProjectCreateFailure(e))
    )
  );

  /**
   * Wait until navigation to project page then load project data and create initial board
   */

  createContentForNewProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType<actions.ProjectCreateSuccess>(actions.PROJECT_CREATE_SUCCESS),
      switchMap((action) => {
        // this waits until router navigation from create$ effect has completed
        return this.actions$.pipe(
          ofType<RouterNavigatedAction>(ROUTER_NAVIGATED),
          map(() => action),
          take(1)
        );
      }),
      switchMap((action) => {
        const { payload, themeId } = action;
        const createBoardAction = new projectActions.BoardCreate();
        const designSystem = this._designSystemService.createNewDesignSystem(payload.id, themeId);
        const createDesignSystemAction = new projectActions.DesignSystemDocumentCreate(
          designSystem
        );
        createBoardAction.isResultingElemActionUndoable = false;

        return [
          new projectActions.ProjectDataQuerySuccess(payload.id, payload),
          createBoardAction,
          createDesignSystemAction,
          new projectActions.ProjectContentQuerySuccess(),
        ];
      })
    )
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

  private handleProjectCreateFailure = (err: any): Observable<never> => {
    const error = err?.message || String(err);
    const message = PROJECT_CREATE_FAILURE_MESSAGE;
    const fullErrorMessage = `${message}: ${error}`;
    this._analyticsService.sendError(fullErrorMessage);
    this._toastService.addToast({ message });
    return EMPTY;
  };
}
