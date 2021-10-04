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

import { IUser } from 'cd-interfaces';
import { IAppState } from 'src/app/store/reducers';
import * as actions from 'src/app/store/actions/user.action';
import * as gapiUtils from 'src/app/utils/gapi.utils';
import { environment } from 'src/environments/environment';
import { IGoPayload } from 'src/app/store/actions/router.action';
import { getIsAdminUser } from 'src/app/store/selectors/user.selector';
import { Observable, from, BehaviorSubject, Subscription, EMPTY } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Store, select } from '@ngrx/store';
import { map, catchError, tap } from 'rxjs/operators';
import firebase from 'firebase/app';

const convertAFUserToIUser = (afUser: firebase.User | null): IUser | undefined => {
  if (!afUser) return undefined;
  const { uid: id, displayName: name, photoURL: photoUrl, email } = afUser;
  return { id, name, email, photoUrl, profileUrl: null };
};

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private _subscriptions = new Subscription();
  public redirectPayload?: IGoPayload;
  public isAdminUser$ = new BehaviorSubject<boolean>(false);

  constructor(public afAuth: AngularFireAuth, private _store: Store<IAppState>) {
    const isAdminUser$ = this._store.pipe(select(getIsAdminUser));
    this._subscriptions.add(isAdminUser$.subscribe(this.isAdminUser$));
  }

  get isAdminUser(): boolean {
    return this.isAdminUser$.getValue();
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  getUser(): Observable<IUser | undefined> {
    return this.afAuth.user.pipe(map(convertAFUserToIUser));
  }

  checkSignIn(): Observable<IUser | undefined> {
    return this.afAuth.user.pipe(
      map(convertAFUserToIUser),
      tap(this._processSignIn),
      // Prevent showing the toast that a user has missing permissions
      catchError((_err, caught) => caught)
    );
  }

  signIn(): Promise<string> {
    return gapiUtils.signInWithGapi();
  }

  signInToFirebase(token: string): Observable<IUser | undefined> {
    const firebaseCredential = firebase.auth.GoogleAuthProvider.credential(token);
    return from(this.afAuth.signInWithCredential(firebaseCredential)).pipe(
      map(({ user }) => convertAFUserToIUser(user)),
      tap(this._processSignIn)
    );
  }

  signInWithToken(token: string): Observable<IUser | undefined> {
    return from(this.afAuth.signInWithCustomToken(token)).pipe(
      map((credential: firebase.auth.UserCredential) => convertAFUserToIUser(credential.user)),
      tap(this._processSignIn)
    );
  }

  async signOut() {
    await gapiUtils.signOutWithGapi();
    this._store.dispatch(new actions.AppSignOutUser());
  }

  signOutOfFirebase(): Observable<void> {
    if (environment.e2e) return EMPTY;
    return from(this.afAuth.signOut());
  }

  private _processSignIn = (user: IUser | undefined) => {
    const action = user ? new actions.AppGetUserSuccess(user) : new actions.AppGetUserFail({});
    this._store.dispatch(action);
  };
}
