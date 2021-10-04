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

import {
  DEFAULT_PROJECT_TYPE,
  FirebaseCollection,
  FirebaseField,
  FirebaseOrderBy,
  FirebaseQueryOperation,
} from 'cd-common/consts';
import { QueryService, IProjectQueryResult } from 'src/app/database/query.service';
import { mergeProjects } from 'src/app/database/query.service.utils';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import * as firestore from '@angular/fire/firestore';
import type * as cd from 'cd-interfaces';
import { getLastQueryResultContainingKeywords } from './search.service.utils';
import { environment } from 'src/environments/environment';

@Injectable()
export class ProjectSearchService extends QueryService {
  private _userRequestSubscription = Subscription.EMPTY;
  public userProjects$ = new BehaviorSubject<cd.IProject[]>([]);
  public otherProjects$ = new BehaviorSubject<cd.IProject[]>([]);
  public userLoading$ = new Subject<boolean>();
  private _activeQuery = '';

  reset(query = '') {
    super.reset();
    this.userProjects$.next([]);
    this.otherProjects$.next([]);
    this.loading = false;
    this.userLoading$.next(false);
    this._activeQuery = query;
  }

  searchForProjects(user: cd.IUser | undefined, query: string) {
    if (!user || !environment.databaseEnabled) return;
    const { id: uid } = user;
    const lowercaseQuery = query.toLowerCase();
    const username = this.usernameFromQuery(lowercaseQuery);
    if (username) return this.searchForProjectsByUsername(username, uid);

    if (this._activeQuery !== lowercaseQuery) {
      this.reset(lowercaseQuery);
      this.searchOwnProjects(lowercaseQuery, uid);
    }

    this.searchOthersProjects(lowercaseQuery, uid);
  }

  searchForProjectsByUsername(username: string, _currentUser: string) {
    if (this._activeQuery !== username) {
      this.reset(username);
    }
    if (!environment.databaseEnabled) return;
    const { loading, _latestEntry, _end } = this;
    if (_end || loading) return;
    this.loading = true;
    this._requestSubscription.unsubscribe();
    const userSearch$ = this.getCollection<cd.IProject>(FirebaseCollection.Projects, (ref) => {
      return this.buildUsernameSearchQuery(ref, username, _latestEntry);
    });
    this._requestSubscription = userSearch$.subscribe((data) =>
      this.onOthersRequestComplete(data, '')
    );
  }

  onUserRequestComplete = (data: IProjectQueryResult[], _query: string) => {
    const projects = data.map((r) => r.data);
    this.userProjects$.next(projects);
    this.userLoading$.next(false);
  };

  removeProjectFromList(projectId: string) {
    const projectQueryResults = [...this.userProjects$.getValue()];
    const idx = projectQueryResults.findIndex((proj) => proj.id === projectId);
    if (idx === -1) return;
    const update = removeValueFromArrayAtIndex(idx, projectQueryResults);
    this.userProjects$.next(update);
  }

  searchOwnProjects(query: string, uid: string) {
    if (!environment.databaseEnabled) return;
    this.userLoading$.next(true);
    this._userRequestSubscription.unsubscribe();
    const ownProjects$ = this.getCollection<cd.IProject>(FirebaseCollection.Projects, (ref) => {
      return this.buildOwnQuery(ref, query, uid);
    });

    this._userRequestSubscription = ownProjects$.subscribe((data) =>
      this.onUserRequestComplete(data, query)
    );
  }

  onOthersRequestComplete = (projectQueryResults: IProjectQueryResult[], uid: string) => {
    const last = getLastQueryResultContainingKeywords(projectQueryResults);
    this._end = projectQueryResults.length === 0;
    this._latestEntry = last && last.doc;
    const projects = projectQueryResults.map((r) => r.data);
    this.updateScreenshotsForProjects(projects);
    const filteredData = projects.filter((item) => item.owner.id !== uid);
    const updates = mergeProjects(this.otherProjects$.getValue(), filteredData);
    this.otherProjects$.next(updates);
    this.loading = false;
  };

  searchOthersProjects(query: string, uid: string) {
    if (!environment.databaseEnabled) return;
    const { loading, _latestEntry, _end } = this;
    if (_end || loading) return;
    this.loading = true;
    this._requestSubscription.unsubscribe();
    const othersRequest$ = this.getCollection<cd.IProject>(FirebaseCollection.Projects, (ref) => {
      return this.buildOthersQuery(ref, query, _latestEntry);
    });
    this._requestSubscription = othersRequest$.subscribe((data) => {
      return this.onOthersRequestComplete(data, uid);
    });
  }

  buildOwnQuery(
    ref: firestore.CollectionReference,
    query: string,
    userId: string
  ): firestore.Query {
    return (
      ref
        // where('keywords', 'array-includes', query)
        .where(FirebaseField.Keywords, FirebaseQueryOperation.Contains, query)
        // where('owner.id', '==', userId)
        .where(FirebaseField.OwnerId, FirebaseQueryOperation.Equals, userId)
        // where('type', '==', 'Default')
        .where(FirebaseField.DocumentType, FirebaseQueryOperation.Equals, DEFAULT_PROJECT_TYPE)
        .orderBy(FirebaseField.Keywords, FirebaseOrderBy.Asc)
        .orderBy(FirebaseField.LastUpdatedAt, FirebaseOrderBy.Desc)
    );
  }

  buildOthersQuery(
    ref: firestore.CollectionReference,
    query: string,
    lastEntry?: firebase.firestore.QueryDocumentSnapshot<unknown>
  ): firestore.Query {
    let reference = ref
      // where('keywords', 'array-includes', query)
      .where(FirebaseField.Keywords, FirebaseQueryOperation.Contains, query)
      // where('type', '==', 'Default')
      .where(FirebaseField.DocumentType, FirebaseQueryOperation.Equals, DEFAULT_PROJECT_TYPE)
      .orderBy(FirebaseField.Keywords, FirebaseOrderBy.Asc)
      .orderBy(FirebaseField.LastUpdatedAt, FirebaseOrderBy.Desc);

    if (lastEntry) reference = reference.startAfter(lastEntry);

    return reference.limit(QueryService.BATCH_SIZE);
  }
}
