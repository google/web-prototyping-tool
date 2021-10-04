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

import { withLatestFrom, tap, filter } from 'rxjs/operators';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { PROJECT_ID_ROUTE_PARAM, Route } from 'src/app/configs/routes.config';
import { DebugService } from 'src/app/services/debug/debug.service';
import { Store, select } from '@ngrx/store';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { ProjectChangeCoordinator } from 'src/app/database/changes/project-change.coordinator';
import { ProjectContentService } from 'src/app/database/changes/project-content.service';
import { AnalyticsEvent } from 'cd-common/analytics';
import * as appStoreModule from 'src/app/store';
import * as action from '../actions';

@Injectable()
export class ProjectContentEffects {
  private _hasCheckedProjectID = '';

  constructor(
    private actions$: Actions,
    private _debugService: DebugService,
    private _appStore: Store<appStoreModule.IAppState>,
    private _analyticsService: AnalyticsService,
    private _projectChangeCoordinator: ProjectChangeCoordinator,
    private _projectContentService: ProjectContentService
  ) {}

  /**
   * Disconnect database subscription when leaving project
   */
  disconnect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.DisconnectProject>(action.DISCONNECT_PROJECT),
        tap(() => {
          this._hasCheckedProjectID = '';
          this._projectChangeCoordinator.closeProject();
        })
      ),
    { dispatch: false }
  );

  healthCheck$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<action.ProjectContentQuerySuccess>(action.PROJECT_CONTENT_QUERY_SUCCESS),
        withLatestFrom(this._projectContentService.project$),
        filter(([, proj]) => proj !== undefined),
        filter(([, project]) => this._hasCheckedProjectID !== project?.id),
        withLatestFrom(this._appStore.pipe(select(appStoreModule.getRouterState))),
        withLatestFrom(this._projectContentService.currentUserIsProjectEditor$),
        tap(([[[, project], routerState], userIsEditor]) => {
          const projectIdFromRoute = routerState.state.params[PROJECT_ID_ROUTE_PARAM] as string;
          // log project opened
          if (!project) return;
          if (!projectIdFromRoute) return;
          if (project.id !== projectIdFromRoute) return;

          this._hasCheckedProjectID = project.id;
          const event = userIsEditor
            ? AnalyticsEvent.ProjectOpenedByOwner
            : AnalyticsEvent.ProjectOpenedByNonOwner;

          this._analyticsService.logEvent(event);
          // and run health checks you own the project
          const isPreviewRoute = routerState.state.url.includes(Route.Preview);
          if (!userIsEditor || isPreviewRoute) return;

          this._debugService.runHealthCheckAndRepairs();
        })
      ),
    { dispatch: false }
  );
}
