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
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subscription, from, of, EMPTY } from 'rxjs';
import { Store } from '@ngrx/store';
import { APP_SIGN_OUT_USER } from 'src/app/store/actions';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { filter, switchMap, take, distinctUntilChanged, catchError, first } from 'rxjs/operators';
import { EMBED_MODE_QUERY_PARAM, AUTH_TOKEN_QUERY_PARAM } from '../../configs/routes.config';
import { ConfigAction } from '../../routes/project/interfaces/action.interface';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';
import * as utils from '../../utils/gapi.utils';
import * as routeUtils from '../../utils/route.utils';
import * as appStoreModule from '../../store';
import type * as cd from 'cd-interfaces';

const filterUndefinedUsers = (users: Array<cd.PartialUser | undefined>): cd.PartialUser[] => {
  return users.filter((item: cd.PartialUser | undefined): item is cd.PartialUser => !!item);
};

@Injectable({
  providedIn: 'root',
})
export class PeopleService {
  private _authenticated$ = new BehaviorSubject(false);
  private _subscriptions = new Subscription();
  private _userCache = new Map<string, cd.PartialUser>();

  public queryResults$ = new BehaviorSubject<cd.PartialUser[]>([]);
  public query$ = new BehaviorSubject<string>('');
  public recentQueries$ = new BehaviorSubject<string[]>([]);
  public requests$ = new Observable<any>();

  constructor(
    private _analyticsService: AnalyticsService,
    private _appStore: Store<appStoreModule.IAppState>,
    private _authService: AuthService,
    private _route: ActivatedRoute
  ) {
    if (!environment.gapiEnabled) return;

    this._subscriptions.add(this._authService.getUser().subscribe(this.onUserSubscription));

    this.requests$ = this.query$.pipe(
      filter((query: string) => (query as string).length > 0),
      distinctUntilChanged<string>((x, y) => x === y),
      switchMap((query: string) =>
        from(this.makeAPIRequestPromise(query)).pipe(catchError((err) => of(err)))
      )
    );

    this.requests$.subscribe(this.updateUserCacheFromSubscription);
  }

  updateUserCache(users: cd.PartialUser[]) {
    for (const user of users) {
      if (user.email) {
        this._userCache.set(user.email, user);
      }
    }
  }

  makeAPIRequestPromise(query: string): Promise<void | cd.PartialUser[]> {
    const isAuthenticated = this._authenticated$.getValue();
    if (isAuthenticated === false) return Promise.reject([]);

    return utils.lookupUserByQuery(query).catch((error: cd.IPeopleApiErrorResponse) => {
      const message = error?.message ?? `There was a problem fetching user with email ${query}`;
      this._analyticsService.sendError(message);
    });
  }

  getUserDetailsFromEmails(emails: string[]): Promise<cd.PartialUser[]> {
    const users = emails.map((user) => this.getUserDetailsForEmail(user, undefined, true));
    return Promise.all(users).then(filterUndefinedUsers);
  }

  getDetailsForEmailsAsObservable(emails: string[]): Observable<cd.PartialUser[]> {
    return this._authenticated$.pipe(
      filter((value) => value === true),
      take(1),
      switchMap(() => from(this.getUserDetailsFromEmails(emails)))
    );
  }

  getUserDetailsForEmailAsObservable(
    email: string,
    imageSize?: number
  ): Observable<cd.PartialUser | undefined> {
    return this._authenticated$.pipe(
      filter((value) => value === true),
      take(1),
      switchMap(() => from(this.getUserDetailsForEmail(email, imageSize)).pipe(take(1))),
      catchError((error: cd.IPeopleApiErrorResponse) => {
        const message = error?.message ?? `There was a problem fetching user with email ${email}`;
        console.log(message);
        return EMPTY;
      })
    );
  }

  getListOfUsersAsObservable(q: string) {
    if (!environment.databaseEnabled) return of([]);
    return this._authenticated$.pipe(
      filter((value) => value === true),
      switchMap(() => from(utils.lookupUserByQuery(q))),
      catchError((error: cd.IPeopleApiErrorResponse) => {
        const message = error?.message ?? `There was a problem fetching users matching ${q}`;
        console.log(message);
        return EMPTY;
      }),
      first()
    );
  }

  private dispatchLogoutUser() {
    const action = new ConfigAction(null, {});
    action.type = APP_SIGN_OUT_USER;
    this._appStore.dispatch(action);
  }

  get authTokenPresentInRoute(): boolean {
    const authTokenPresent = routeUtils.getRouterParamValue(
      this._route.snapshot,
      AUTH_TOKEN_QUERY_PARAM
    );
    return authTokenPresent !== null;
  }

  get isEmbeddedPreview(): boolean {
    const embedMode = routeUtils.getRouterParamValue(this._route.snapshot, EMBED_MODE_QUERY_PARAM);
    return coerceBooleanProperty(embedMode);
  }

  get ignoreAuthState() {
    return this.isEmbeddedPreview || this.authTokenPresentInRoute || !environment.databaseEnabled;
  }

  private onUserSubscription = async (_user: cd.IUser | undefined) => {
    if (this.ignoreAuthState) return;

    try {
      const authenticated = await utils.getSessionToken();
      this._authenticated$.next(!!authenticated);
    } catch (error) {
      if (utils.didGAPILoad()) this.dispatchLogoutUser();
    }
  };

  private updateUserCacheFromSubscription = (results: cd.PartialUser[]) => {
    this.updateUserCache(results);
    this.queryResults$.next(results);
  };

  private async getUserDetailsForEmail(
    email: string,
    imageSize?: number | undefined,
    ignoreMissing = false
  ): Promise<cd.PartialUser | undefined> {
    const user = this._userCache.get(email);
    if (user) return Promise.resolve(user);

    const userHasAuthScopes = await utils.checkScopes();

    if (userHasAuthScopes === false && !this.ignoreAuthState) {
      this.dispatchLogoutUser();
    }

    const fetchedUsers = await utils.lookupUserByQuery(email, imageSize);
    const firstUser = fetchedUsers && fetchedUsers[0];
    if (ignoreMissing && !firstUser) return Promise.resolve(undefined);
    if (!firstUser) return Promise.reject();

    this.updateUserCache([firstUser]);

    return Promise.resolve(firstUser);
  }
}
