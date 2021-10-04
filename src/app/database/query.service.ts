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

import { map, first, take, takeUntil, retry, switchMap } from 'rxjs/operators';
import { Subscription, BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { ScreenshotService } from 'src/app/services/screenshot-lookup/screenshot-lookup.service';
import * as firestore from '@angular/fire/firestore';
import * as cd from 'cd-interfaces';
import { OnDestroy, Injectable } from '@angular/core';
import { stringMatchesRegex } from 'cd-utils/string';
import type firebase from 'firebase/app';
import {
  DEFAULT_PROJECT_TYPE,
  FirebaseField,
  FirebaseOrderBy,
  FirebaseQueryOperation,
  TILE_THUMBNAIL_LIMIT,
  UNICODE_RANGE_MAX,
} from 'cd-common/consts';
import { DatabaseService } from './database.service';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
const OWNER_REGEX = /^owner:/;

export type FirestoreDocSnapshot = firebase.firestore.QueryDocumentSnapshot<unknown>;

export interface IQueryResult<T extends cd.IBaseDocument> {
  data: T;
  doc: FirestoreDocSnapshot;
}

export type IProjectQueryResult = IQueryResult<cd.IProject>;

export type IPublishEntryQueryResult = IQueryResult<cd.IPublishEntry>;

@Injectable({
  providedIn: 'root',
})
export class QueryService implements OnDestroy {
  static BATCH_SIZE = 36;

  private _loading = false;
  private _loading$ = new Subject<boolean>();
  protected readonly destroyed = new ReplaySubject<void>(1);
  protected _latestEntry?: FirestoreDocSnapshot;
  protected _subscriptions = new Subscription();
  protected _screenshotSubscription = new Subscription();
  protected _requestSubscription = Subscription.EMPTY;
  protected _end = false;
  public boardThumbnails$ = new BehaviorSubject(new Map<string, cd.IScreenshotRef[]>());

  constructor(
    protected _screenshotService: ScreenshotService,
    protected _afs: firestore.AngularFirestore,
    protected _databaseService: DatabaseService
  ) {}

  getCollection<T extends cd.IBaseDocument>(
    ref: string,
    queryFn?: firestore.QueryFn
  ): Observable<IQueryResult<T>[]> {
    return (
      this._afs
        .collection(ref, queryFn)
        // Fix for cached results from firebase b/154047381
        // .snapshotChanges()
        .get({ source: 'server' })
        .pipe(
          retry(3),
          first(), // Auto unsubscribe
          map((results) =>
            results.docs.reduce<IQueryResult<T>[]>((acc, doc) => {
              const id = doc.id;
              const data = doc.data() as T;
              if (!id) {
                console.error('Missing id for document', id);
                return acc;
              }
              acc.push({ data, doc });
              return acc;
            }, [])
          ),
          takeUntil(this.destroyed)
        )
    );
  }

  set loading(value: boolean) {
    if (this._loading === value) return;
    this._loading$.next(value);
    this._loading = value;
  }

  get loading() {
    return this._loading;
  }

  get loading$() {
    return this._loading$;
  }

  reset() {
    this._end = false;
    this._latestEntry = undefined;
    this.loading = false;
  }

  updateScreenshotsForProjects(data: cd.IProject[]) {
    this._screenshotSubscription = new Subscription();

    for (const proj of data) {
      const boards$ = this._databaseService.getProjectBoards(proj, TILE_THUMBNAIL_LIMIT);
      const screenshots$ = boards$.pipe(
        switchMap((boards) => {
          const boardIds = boards.map((b) => b.id);
          return this._screenshotService.getScreenshotUrl(boardIds);
        }),
        take(1),
        takeUntil(this.destroyed)
      );

      this._screenshotSubscription.add(
        screenshots$.subscribe((ref) => {
          const thumbnails = this.boardThumbnails$.getValue();
          thumbnails.set(proj.id, ref);
          this.boardThumbnails$.next(thumbnails);
        })
      );
    }
  }

  buildUsernameSearchQuery(
    ref: firestore.CollectionReference,
    query: string,
    lastEntry?: firebase.firestore.QueryDocumentSnapshot<unknown>,
    types: cd.IProject['type'][] = [DEFAULT_PROJECT_TYPE]
  ): firestore.Query {
    let reference = ref
      .where(FirebaseField.OwnerEmail, FirebaseQueryOperation.GreaterThanOrEqualTo, query)
      .where(
        FirebaseField.OwnerEmail,
        FirebaseQueryOperation.LessThanOrEqualTo,
        query + UNICODE_RANGE_MAX
      )
      .where(FirebaseField.DocumentType, FirebaseQueryOperation.In, types)
      .orderBy(FirebaseField.OwnerEmail, FirebaseOrderBy.Asc)
      .orderBy(FirebaseField.LastUpdatedAt, FirebaseOrderBy.Desc);

    if (lastEntry) reference = reference.startAfter(lastEntry);

    return reference.limit(QueryService.BATCH_SIZE);
  }

  usernameFromQuery = (query: string): string | undefined => {
    const isOwner = !query.includes(FirebaseField.Owner) && stringMatchesRegex(query, EMAIL_REGEX);
    const value = isOwner ? `${FirebaseField.Owner}:${query}` : query;
    return value.split(OWNER_REGEX)[1];
  };

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
    this._requestSubscription.unsubscribe();
  }
}
