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

import * as cd from 'cd-interfaces';
import firestore from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { QueryService, IPublishEntryQueryResult } from './query.service';
import { BehaviorSubject } from 'rxjs';
import { mergePublishEntryData } from './query.service.utils';
import { removeValueFromArrayAtIndex } from 'cd-utils/array';
import type firebase from 'firebase/app';
import {
  FirebaseField,
  FirebaseCollection,
  FirebaseOrderBy,
  FirebaseQueryOperation,
} from 'cd-common/consts';

@Injectable()
export class ComponentQueryService extends QueryService {
  public publishedComponents$ = new BehaviorSubject<IPublishEntryQueryResult[]>([]);

  reset() {
    super.reset();
    this.publishedComponents$.next([]);
  }

  onRequestComplete = (publishEntryResults: IPublishEntryQueryResult[]) => {
    const last = publishEntryResults[publishEntryResults.length - 1];
    this._end = publishEntryResults.length === 0;
    this._latestEntry = last && last.doc;
    const updates = mergePublishEntryData(
      this.publishedComponents$.getValue(),
      publishEntryResults
    );
    this.publishedComponents$.next(updates);
    this.loading = false;
  };

  buildPublishEntryQuery(
    ref: firestore.CollectionReference,
    lastEntry?: firebase.firestore.QueryDocumentSnapshot<unknown>
  ): firestore.Query {
    let reference = ref
      .where(FirebaseField.DocumentType, FirebaseQueryOperation.In, [
        cd.PublishType.CodeComponent,
        cd.PublishType.Symbol,
      ])
      .orderBy(FirebaseField.LastUpdatedAt, FirebaseOrderBy.Desc);

    if (lastEntry) reference = reference.startAfter(lastEntry);

    return reference.limit(QueryService.BATCH_SIZE);
  }

  loadAllSortedByDateWithLimit() {
    const { loading, _latestEntry, _end } = this;
    if (_end || loading) return;
    this.loading = true;
    this._requestSubscription.unsubscribe();
    this._requestSubscription = this.getCollection<cd.IPublishEntry>(
      FirebaseCollection.PublishEntries,
      (ref) => this.buildPublishEntryQuery(ref, _latestEntry)
    ).subscribe(this.onRequestComplete);
  }

  removeEntryFromList(id: string) {
    const publishEntries = [...this.publishedComponents$.getValue()];
    const idx = publishEntries.findIndex((entry) => entry.data.id === id);
    if (idx === -1) return;
    const update = removeValueFromArrayAtIndex(idx, publishEntries);
    this.publishedComponents$.next(update);
  }
}
