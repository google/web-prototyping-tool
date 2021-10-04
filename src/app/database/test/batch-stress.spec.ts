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

import { BatchChunker } from '../batch-chunker.class';
import { DatabaseService } from '../database.service';
import { initService, TestCollection } from './test.utils';
import * as data from './test-data';

/** Max writes/deletes for a single commit. */
const MAX_OPERATIONS = 3000;

/** Need to increase Jasmine timeout from 5s to 30s for stress tests. */
const TIMEOUT_INTERVAL = 30000;

/**
 * Testing large batches of writes/deletes.
 *  Note: Keep these disabled since they greatly increase time and costs.
 */
xdescribe('Batch stress tests', () => {
  const collection = new TestCollection<data.ITestDoc>(data.TEST_COLLECTION, true);
  let firestore: any;
  let service: DatabaseService;
  let batchChunker: BatchChunker;

  beforeEach(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = TIMEOUT_INTERVAL;
    service = initService(DatabaseService);
    firestore = service['_afs'];
    batchChunker = new BatchChunker(firestore);
    await collection.deleteAll();
  });

  afterAll(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
    await collection.deleteAll();
  });

  it('commits large batch of writes and deletes', async () => {
    // Add initial docs
    let docs = data.generateTestDocs(MAX_OPERATIONS);
    for (const doc of docs) {
      const path = `${data.TEST_COLLECTION}/${doc.id}`;
      const ref = firestore.doc(path).ref;
      batchChunker.set(ref, doc);
    }
    await batchChunker.commit();

    // Verify
    let query = await collection.queryAll('id');
    expect(query.length).toBe(docs.length);
    expect(query).toEqual(docs);

    // Add more docs
    const batchChunker2 = new BatchChunker(firestore);
    docs = data.generateTestDocs(MAX_OPERATIONS, MAX_OPERATIONS);
    for (const doc of docs) {
      const path = `${data.TEST_COLLECTION}/${doc.id}`;
      const ref = firestore.doc(path).ref;
      batchChunker2.set(ref, doc);
    }
    // Delete initial docs
    for (let i = 0; i < MAX_OPERATIONS; i++) {
      const path = `${data.TEST_COLLECTION}/${i}`;
      const ref = firestore.doc(path).ref;
      batchChunker2.delete(ref);
    }
    await batchChunker2.commit();

    // Verify
    query = await collection.queryAll('id');
    expect(query.length).toBe(docs.length);
    expect(query).toEqual(docs);

    // Delete remaining
    const batchChunker3 = new BatchChunker(firestore);
    for (let i = 0; i < 10; i++) {
      const path = `${data.TEST_COLLECTION}/${i}`;
      const ref = firestore.doc(path).ref;
      batchChunker3.delete(ref);
    }
    await batchChunker3.commit();
  });
});
