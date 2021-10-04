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
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import * as dashboardActions from 'src/app/routes/dashboard/store/actions';
import * as projectActions from 'src/app/routes/project/store/actions';
import { AnalyticsEvent } from 'cd-common/analytics';

@Injectable()
export class AnalyticsEffects {
  constructor(private actions$: Actions, private _analyticsService: AnalyticsService) {}

  logProjectCreate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(dashboardActions.PROJECT_CREATE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.ProjectCreate))
      ),
    { dispatch: false }
  );

  logProjectDelete$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(dashboardActions.PROJECT_DELETE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.ProjectDelete))
      ),
    { dispatch: false }
  );

  logCommentCreate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.COMMENT_CREATE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.CommentCreate))
      ),
    { dispatch: false }
  );

  logCommentUpdate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.COMMENT_UPDATE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.CommentEdit))
      ),
    { dispatch: false }
  );

  logCommentDelete$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.COMMENT_DELETE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.CommentDelete))
      ),
    { dispatch: false }
  );

  logDesignSystemUpdate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.DESIGN_SYSTEM_UPDATE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.DesignSystemUpdate))
      ),
    { dispatch: false }
  );

  logSymbolCreated$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.SYMBOL_CREATE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.ComponentCreate))
      ),
    { dispatch: false }
  );

  logSymbolRemoved$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.SYMBOL_DELETE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.ComponentDelete))
      ),
    { dispatch: false }
  );

  logSymbolUnpacked$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.SYMBOL_UNPACK_INSTANCE_CONFIRM),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.ComponentUnpack))
      ),
    { dispatch: false }
  );

  logCodeComponentCreate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.CODE_COMPONENT_CREATE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.CodeComponentCreated))
      ),
    { dispatch: false }
  );

  logCodeComponentUpdate$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.CODE_COMPONENT_UPDATE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.CodeComponentUpdated))
      ),
    { dispatch: false }
  );

  logCodeComponentRemoved$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(projectActions.CODE_COMPONENT_DELETE),
        tap(() => this._analyticsService.logEvent(AnalyticsEvent.CodeComponentRemoved))
      ),
    { dispatch: false }
  );
}
