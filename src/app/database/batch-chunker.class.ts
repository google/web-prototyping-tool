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

import { AngularFirestore } from '@angular/fire/firestore';
import { FIRESTORE_BATCH_LIMIT } from 'cd-common/consts';
import type firebase from 'firebase/app';

export class BatchChunker {
  public id = Symbol(); // Unique identifier
  private _batches: firebase.firestore.WriteBatch[] = [];
  private _count = 0;

  constructor(private _afs?: AngularFirestore) {}

  get currentBatch() {
    this._checkWriteCount();
    const { _batches } = this;
    const activeBatch = _batches[_batches.length - 1];
    return activeBatch;
  }

  public set(
    documentRef: firebase.firestore.DocumentReference,
    data: firebase.firestore.DocumentData
  ) {
    this.currentBatch.set(documentRef, data);
  }

  public update(
    documentRef: firebase.firestore.DocumentReference<any>,
    data: firebase.firestore.UpdateData
  ) {
    this.currentBatch.update(documentRef, data);
  }

  public delete(documentRef: firebase.firestore.DocumentReference) {
    this.currentBatch.delete(documentRef);
  }

  public async commit(): Promise<void> {
    for (const batch of this._batches) {
      await batch.commit();
    }
  }

  private _checkWriteCount() {
    if (this._count % FIRESTORE_BATCH_LIMIT === 0) {
      const { _afs } = this;
      if (_afs) {
        const batch = _afs.firestore.batch();
        this._batches.push(batch);
      }
    }
    // Must be called 2nd
    this._count++;
  }
}
