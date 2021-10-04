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

const FIRESTORE_BATCH_LIMIT = 450;

export class BatchChunker {
  public batches: FirebaseFirestore.WriteBatch[] = [];
  public count = 0;

  constructor(public db: FirebaseFirestore.Firestore) {}

  getCurrentBatch() {
    if (this.count % FIRESTORE_BATCH_LIMIT === 0) {
      const batch = this.db.batch();
      this.batches.push(batch);
    }
    this.count++;
    return this.batches[this.batches.length - 1];
  }

  public commit(): Promise<FirebaseFirestore.WriteResult[][]> {
    return Promise.all(this.batches.map(async batch => await batch.commit()));
  }
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
