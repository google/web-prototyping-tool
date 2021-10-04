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
import { Store, select } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import * as appStore from '../../store';
import { GUEST_USER } from '../../configs/guest-user.config';
import { AuthService } from '../../services/auth/auth.service';
import { AUTH_TOKEN_QUERY_PARAM, EMBED_MODE_QUERY_PARAM } from 'src/app/configs/routes.config';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    public afAuth: AngularFireAuth,
    private authService: AuthService,
    private store: Store<appStore.IAppState>
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkUser(route, state);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.canActivate(route, state);
  }

  checkUser(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> {
    return this.store.pipe(select(appStore.getUser)).pipe(
      switchMap((user) => {
        if (!user) {
          const token = route.queryParams[AUTH_TOKEN_QUERY_PARAM] as string;
          const embedMode = coerceBooleanProperty(route.queryParams[EMBED_MODE_QUERY_PARAM]);

          if (token) {
            // this.store.dispatch(new appStore.AppGetUserWithToken(token));
            return this.authService.signInWithToken(token);
          }

          if (embedMode) {
            return of(GUEST_USER);
          }

          // if no user, save reference to page that was attempted
          // so we can redirect after login
          // this.authService.redirectUrl = state.url;

          // dispatch action to the get the user
          // this.store.dispatch(new appStore.AppGetUser());
          return this.authService.checkSignIn();
        }
        return of(user);
      }),
      switchMap((user) => {
        return of(!!user);
      })
    );
  }
}
