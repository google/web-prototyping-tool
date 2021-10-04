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

import type * as cd from 'cd-interfaces';
import * as firestore from '@angular/fire/firestore';
import { FirebaseCollection, FirebaseField, FirebaseQueryOperation } from 'cd-common/consts';
import { Injectable } from '@angular/core';
import { createId } from 'cd-utils/guid';
import { select, Store } from '@ngrx/store';
import { IAppState } from 'src/app/store/reducers';
import { getUser } from 'src/app/store/selectors';
import { BehaviorSubject, fromEvent, Subscription } from 'rxjs';
import { presencePathForId } from 'src/app/database/path.utils';
import { constructPresenceDoc, constructPresenceExitUrl } from './presence.utils';
import firebase from 'firebase/app';
import 'firebase/firestore';

const PRESENCE_POLL_TIME = 20000;

@Injectable({
  providedIn: 'root',
})
export class PresenceService {
  public readonly sessionId = createId();

  private _subscriptions = new Subscription();
  private _querySubscription = Subscription.EMPTY;
  private _user?: cd.IUserIdentity;
  private _pollInterval?: number;
  private _currentProjectId?: string;

  public currentPresence$ = new BehaviorSubject<cd.IUserPresence | undefined>(undefined);
  public otherPresentUsers$ = new BehaviorSubject<cd.IUserPresence[]>([]);
  public otherPresentUsersMap$ = new BehaviorSubject<Map<string, cd.IUserPresence>>(new Map());

  constructor(private store: Store<IAppState>, private afs: firestore.AngularFirestore) {
    const user$ = this.store.pipe(select(getUser));
    this._subscriptions.add(user$.subscribe(this.onUserSubscription));

    const visibilityChange$ = fromEvent(document, 'visibilitychange');
    this._subscriptions.add(visibilityChange$.subscribe(this.onVisibilityChange));
  }

  markPresenceInProject(projectId: string) {
    const { sessionId, _user } = this;
    if (!_user) return;

    // save what projectId we are currently present in
    this._currentProjectId = projectId;

    // Mark presence in this project
    const presenceDocPath = presencePathForId(sessionId);
    const presence = constructPresenceDoc(_user, projectId, sessionId);
    this.currentPresence$.next(presence);
    this.afs.firestore.doc(presenceDocPath).set(presence);

    // Setup poll interval to update pollTime in presence doc
    const { setInterval, clearInterval } = window;
    if (this._pollInterval !== undefined) clearInterval(this._pollInterval);
    this._pollInterval = setInterval(() => this.updatePollTime(), PRESENCE_POLL_TIME);

    // query to see what other users are present in this project
    const othersPresent$ = this.afs
      .collection<cd.IUserPresence>(FirebaseCollection.UserPresence, (ref) =>
        ref
          .where(FirebaseField.ProjectId, FirebaseQueryOperation.Equals, projectId)
          .where(FirebaseField.SessionId, FirebaseQueryOperation.NotEqualTo, this.sessionId)
      )
      .valueChanges();
    this._querySubscription = othersPresent$.subscribe(this.onOthersPresent);
  }

  removePresence() {
    window.clearInterval(this._pollInterval);
    this.currentPresence$.next(undefined);
    this.otherPresentUsers$.next([]);
    this.otherPresentUsersMap$.next(new Map());
    this._querySubscription.unsubscribe();

    const { sessionId } = this;
    const presenceDocPath = presencePathForId(sessionId);
    return this.afs.firestore.doc(presenceDocPath).delete();
  }

  private onOthersPresent = (othersPresent: cd.IUserPresence[]) => {
    this.otherPresentUsers$.next(othersPresent);

    const othersPresentMap = new Map(othersPresent.map((o) => [o.sessionId, o]));
    this.otherPresentUsersMap$.next(othersPresentMap);
  };

  private onUserSubscription = (user?: cd.IUser) => {
    this._user = user;
  };

  private updatePollTime = () => {
    const currentPresence = this.currentPresence$.getValue();
    if (!currentPresence) return;
    const pollTime = firebase.firestore.Timestamp.now();
    const presenceDocPath = presencePathForId(this.sessionId);
    this.afs.firestore.doc(presenceDocPath).set({ ...currentPresence, pollTime });
  };

  private onVisibilityChange = () => {
    const { visibilityState } = document;
    const { sessionId, _currentProjectId } = this;
    if (!_currentProjectId) return;

    if (visibilityState === 'hidden') {
      this.removePresence();
      const url = constructPresenceExitUrl(sessionId);
      navigator.sendBeacon(url);
    } else {
      this.markPresenceInProject(_currentProjectId);
    }
  };
}
