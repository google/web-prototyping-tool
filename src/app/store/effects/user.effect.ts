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

import { of } from 'rxjs';
import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { map, catchError, switchMap, withLatestFrom } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';
import { RoutePath } from 'src/app/configs/routes.config';
import * as userActions from '../actions/user.action';
import * as routerActions from '../actions/router.action';
import { IAppState, getRouterState } from '../reducers';
import { Store, select } from '@ngrx/store';
import { DatabaseService } from 'src/app/database/database.service';

@Injectable()
export class UserEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private _appStore: Store<IAppState>,
    private _databaseService: DatabaseService
  ) {}

  getUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.APP_GET_USER),
      switchMap(() => this.authService.getUser()),
      map((user) => {
        if (user) return new userActions.AppGetUserSuccess(user);
        throw new Error('Failed to get user');
      }),
      catchError((error) => of(new userActions.AppGetUserFail(error)))
    )
  );

  getUserWithToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType<userActions.AppGetUserWithToken>(userActions.APP_GET_USER_WITH_TOKEN),
      switchMap(({ token }) => this.authService.signInWithToken(token)),
      map((user) => {
        if (user) return new userActions.AppGetUserSuccess(user);
        throw new Error('Failed to get user');
      }),
      catchError((error) => of(new userActions.AppGetUserFail(error)))
    )
  );

  signInUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType<userActions.AppSignInUser>(userActions.APP_SIGN_IN_USER),
      switchMap(({ token }) =>
        this.authService.signInToFirebase(token).pipe(
          map((user) => {
            if (user) return new userActions.AppSignInUserSuccess(user);
            throw new Error('Sign in failed');
          }),
          catchError((error) => of(new userActions.AppSignInUserFail(error)))
        )
      )
    )
  );

  signOutUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.APP_SIGN_OUT_USER),
      switchMap(() =>
        this.authService.signOutOfFirebase().pipe(
          map(() => new userActions.AppSignOutUserSuccess()),
          catchError(() => of(new userActions.AppSignOutUserFail()))
        )
      )
    )
  );

  signInUserSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.APP_SIGN_IN_USER_SUCCESS),
      map(() => {
        const payload = this.authService.redirectPayload || { path: [RoutePath.Dashboard] };
        return new routerActions.AppGo(payload);
      })
    )
  );

  redirectToSignIn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.APP_SIGN_OUT_USER_SUCCESS),
      map(() => {
        const payload = { path: [RoutePath.SignIn] };
        return new routerActions.AppGo(payload);
      })
    )
  );

  getUserFail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.APP_GET_USER_FAIL),
      withLatestFrom(this._appStore.pipe(select(getRouterState))),
      map(([, routerState]) => {
        // save current url in auth service, so we know where to redirect after sign in
        const path = [window.location.pathname];
        const query = routerState.state.queryParams;
        this.authService.redirectPayload = { path, query };

        const payload = { path: [RoutePath.SignIn] };
        return new routerActions.AppGo(payload);
      })
    )
  );

  checkIfAdminUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType<userActions.AppGetUserSuccess>(userActions.APP_GET_USER_SUCCESS),
      switchMap((action) => this._databaseService.checkIfAdminUser(action.payload)),
      map((isAdmin) => new userActions.AppSetAdminUser(isAdmin))
    )
  );
}
