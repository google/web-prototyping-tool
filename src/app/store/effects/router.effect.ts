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

import { constructPreviewPath } from 'src/app/utils/route.utils';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { getRouterState, IAppState } from '../reducers';
import { Injectable, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { tap, map, filter, withLatestFrom } from 'rxjs/operators';
import * as config from 'src/app/configs/routes.config';
import * as routerActions from '../actions/router.action';
import * as cd from 'cd-interfaces';

@Injectable()
export class RouterEffects {
  constructor(
    private actions$: Actions,
    private ngZone: NgZone,
    private router: Router,
    private location: Location,
    private appStore: Store<IAppState>
  ) {}

  navigate$ = createEffect(
    () =>
      this.actions$.pipe(ofType<routerActions.AppGo>(routerActions.APP_GO)).pipe(
        map((action) => action.payload),
        tap(({ path, query: queryParams, extras }) => {
          // work around for Angular routing issue:
          // https://github.com/angular/angular/issues/25837
          this.ngZone.run(() => this.router.navigate(path, { queryParams, ...extras })).then();
        })
      ),
    { dispatch: false }
  );

  navigateBack$ = createEffect(
    () => this.actions$.pipe(ofType(routerActions.APP_BACK)).pipe(tap(() => this.location.back())),
    { dispatch: false }
  );

  navigateForward$ = createEffect(
    () =>
      this.actions$
        .pipe(ofType(routerActions.APP_FORWARD))
        .pipe(tap(() => this.location.forward())),
    { dispatch: false }
  );

  goToPreview$ = createEffect(() =>
    this.actions$.pipe(
      ofType<routerActions.AppGoToPreview>(routerActions.APP_GO_TO_PREVIEW),
      withLatestFrom(this.appStore.pipe(select(getRouterState))),
      filter(([, router]) => !!router.state.params[config.PROJECT_ID_ROUTE_PARAM]),
      map(([action, router]) => {
        const projectId = router.state.params[config.PROJECT_ID_ROUTE_PARAM];
        const { rootId, showComments } = action;
        const path = constructPreviewPath(projectId);
        const payload: routerActions.IGoPayload = { path: [path] };
        const query: Partial<cd.IPreviewParams> = {
          id: rootId || '',
          comments: !!showComments,
        };
        payload.query = query;
        return new routerActions.AppGo(payload);
      })
    )
  );
}
