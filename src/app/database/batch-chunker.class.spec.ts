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

import { BatchChunker } from './batch-chunker.class';
import { DatabaseService } from './database.service';
import { initService, TestCollection } from './test/test.utils';
import * as data from './test/test-data';

const WRITE_DELETE_COUNT = 10;

describe('Batch Chunker', () => {
  const collection = new TestCollection<data.ITestDoc>(data.TEST_COLLECTION, true);
  let firestore: any;
  let service: DatabaseService;
  let batchChunker: BatchChunker;

  beforeEach(async () => {
    service = initService(DatabaseService);
    firestore = service['_afs'];
    batchChunker = new BatchChunker(firestore);
    await collection.deleteAll();
  });

  afterAll(async () => await collection.deleteAll());

  it('commits batch of writes', async () => {
    const docs = data.generateTestDocs(WRITE_DELETE_COUNT);
    for (const doc of docs) {
      const path = collection.getPath(doc.id);
      const ref = firestore.doc(path).ref;
      batchChunker.set(ref, doc);
    }
    await batchChunker.commit();
    const query = await collection.queryAll('id');
    expect(query.length).toBe(docs.length);
    expect(query).toEqual(docs);
  });

  it('commits batch of writes and deletes', async () => {
    // Add initial docs
    let docs = data.generateTestDocs(WRITE_DELETE_COUNT);
    for (const doc of docs) {
      const path = collection.getPath(doc.id);
      const ref = firestore.doc(path).ref;
      batchChunker.set(ref, doc);
    }
    await batchChunker.commit();

    // Add more docs
    const batchChunker2 = new BatchChunker(firestore);
    docs = data.generateTestDocs(WRITE_DELETE_COUNT, WRITE_DELETE_COUNT);
    for (const doc of docs) {
      const path = collection.getPath(doc.id);
      const ref = firestore.doc(path).ref;
      batchChunker2.set(ref, doc);
    }
    // Delete original docs
    for (let i = 0; i < WRITE_DELETE_COUNT; i++) {
      const path = collection.getPath(i.toString());
      const ref = firestore.doc(path).ref;
      batchChunker2.delete(ref);
    }
    await batchChunker2.commit();

    const query = await collection.queryAll('id');
    expect(query.length).toBe(docs.length);
    expect(query).toEqual(docs);
  });
});
