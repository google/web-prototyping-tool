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

import { DatabaseService } from './database.service';
import { FirebaseCollection, FirebaseCollectionType } from 'cd-common/consts';
import { initService, TestCollection, FirestoreSpy } from './test/test.utils';
import { NetworkSwitch } from './test/network-switch';
import * as cd from 'cd-interfaces';
import * as data from './test/test-data';
import type firebase from 'firebase/app';

describe('DatabaseService CRUD', () => {
  const collection = new TestCollection<data.ITestDoc>(data.TEST_COLLECTION, true);
  const TEST_PATH = collection.getPath(data.TEST_ID);
  const network = new NetworkSwitch();
  let service: DatabaseService;
  let firestore: any;

  beforeEach(async () => {
    service = initService(DatabaseService);
    firestore = service['_afs'];
    await collection.deleteAll();
  });

  afterAll(async () => await collection.deleteAll());

  it('is initialized', () => {
    expect(service).toBeTruthy();
    expect(service instanceof DatabaseService).toBe(true);
    expect(firestore).not.toBe(undefined);
  });

  it('sets a document', async () => {
    await service.setDocument(TEST_PATH, data.TEST_DOC);
    const doc = await collection.getDoc(data.TEST_ID);
    expect(doc.id).toBe(data.TEST_DOC.id);
  });

  it('updates a document', async () => {
    await service.setDocument(TEST_PATH, data.TEST_DOC);
    const updatedDoc = { ...data.TEST_DOC, ...{ count: 7 } };
    await service.updateDocument(TEST_PATH, updatedDoc);
    const doc = await collection.getDoc(data.TEST_ID);
    expect(doc.count).toBe(7);
  });

  it('gets a document', async (done) => {
    await collection.setDoc(data.TEST_ID, data.TEST_DOC);
    service
      .getDocument(TEST_PATH)
      .subscribe((snapshot: firebase.firestore.DocumentSnapshot<any>) => {
        const doc = snapshot.data();
        if (doc) {
          expect(doc.id).toBe(data.TEST_DOC.id);
          done();
        }
      });
  });

  it('gets a documents data', async (done) => {
    await collection.setDoc(data.TEST_ID, data.TEST_DOC);
    service.getDocumentData(TEST_PATH).subscribe((doc: any) => {
      expect(doc.id).toBe(data.TEST_DOC.id);
      done();
    });
  });

  // TODO: Fix this test
  xit('getting document retries 3 times', async (done) => {
    await collection.setDoc(data.TEST_ID, data.TEST_DOC);
    const spy = new FirestoreSpy(service);
    network.disable();
    service.getDocument(TEST_PATH).subscribe(() => {
      expect(spy.docCalls).toBe(3);
      done();
    });
  });

  it('queries all in a collection', async (done) => {
    await Promise.all(data.TEST_DOCS_ARRAY.map((doc: any) => collection.setDoc(doc.id, doc)));
    service
      .getCollection<data.ITestDoc>(collection.name as FirebaseCollectionType)
      .subscribe((docs: data.ITestDoc[]) => {
        expect(docs.length).toBe(data.TEST_DOCS_ARRAY.length);
        expect(docs).toEqual(data.TEST_DOCS_ARRAY);
        done();
      });
  });

  it('queries a sorted collection', async (done) => {
    await Promise.all(data.TEST_DOCS_ARRAY.map((doc: any) => collection.setDoc(doc.id, doc)));
    service
      .getCollection<data.ITestDoc>(collection.name as FirebaseCollectionType, (ref) =>
        ref.orderBy('id', 'desc')
      )
      .subscribe((docs: data.ITestDoc[]) => {
        expect(docs.length).toBe(data.TEST_DOCS_ARRAY.length);
        expect(docs[0].id).toEqual(data.TEST_DOC3.id);
        expect(docs[2].id).toEqual(data.TEST_DOC.id);
        done();
      });
  });

  it('queries a collection with where clause', async (done) => {
    await Promise.all(data.TEST_DOCS_ARRAY.map((doc: any) => collection.setDoc(doc.id, doc)));
    service
      .getCollection<data.ITestDoc>(collection.name as FirebaseCollectionType, (ref) =>
        ref.where('count', '>', 1)
      )
      .subscribe((docs: data.ITestDoc[]) => {
        expect(docs.length).toBe(2);
        expect(docs[0].count).toEqual(2);
        expect(docs[1].count).toEqual(3);
        done();
      });
  });

  it('writes a batch of items', async () => {
    const docs = data.generateTestDocs(10);
    const batchPayload: cd.WriteBatchPayload = new Map();
    for (const doc of docs) {
      const path = collection.getPath(doc.id);
      const ref = firestore.doc(path).ref;
      batchPayload.set(ref, doc as any);
    }
    await service.batchChanges(batchPayload);

    const query = await collection.queryAll('id');
    expect(query.length).toBe(docs.length);
    expect(query).toEqual(docs);
  });

  it('writes and deletes a batch of items', async () => {
    // Add initial docs
    let docs = data.generateTestDocs(10);
    let batchPayload: cd.WriteBatchPayload = new Map();
    const deletes = new Set<string>();
    for (const doc of docs) {
      const path = collection.getPath(doc.id);
      deletes.add(path);
      const ref = firestore.doc(path).ref;
      batchPayload.set(ref, doc as any);
    }
    await service.batchChanges(batchPayload);

    // Add new docs, delete old
    docs = data.generateTestDocs(10, 10);
    batchPayload = new Map();
    for (const doc of docs) {
      const path = collection.getPath(doc.id);
      const ref = firestore.doc(path).ref;
      batchPayload.set(ref, doc as any);
    }
    await service.batchChanges(batchPayload, deletes);

    // Verify
    const query = await collection.queryAll('id');
    expect(query.length).toBe(docs.length);
    expect(query).toEqual(docs);
  });
});

describe('DatabaseService project data', () => {
  const projectCollection = new TestCollection<cd.IProject>(FirebaseCollection.Projects);
  const contentsCollection = new TestCollection<cd.IProjectContentDocument>(
    FirebaseCollection.ProjectContents
  );
  let service: DatabaseService;

  beforeEach(async () => {
    service = initService(DatabaseService);
    await projectCollection.deleteAll();
    await contentsCollection.deleteAll();
  });

  afterAll(async () => {
    await projectCollection.deleteAll();
    await contentsCollection.deleteAll();
  });

  it('gets the project contents', async (done) => {
    await contentsCollection.setDoc(data.TEST_ELEMENT.id, data.TEST_ELEMENT);
    service.getProjectContents(data.TEST_PROJECT_ID).subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0]).toEqual(data.TEST_ELEMENT);
      done();
    });
  });

  it('writes a project and contents', (done) => {
    service.writeProjectAndContents(data.TEST_PROJECT, [data.TEST_ELEMENT]).subscribe(async () => {
      const project = await projectCollection.getDoc(data.TEST_PROJECT_ID);
      expect(project).toEqual(project);
      const elements = await contentsCollection.queryAll();
      expect(elements.length).toBe(1);
      expect(elements[0]).toEqual(data.TEST_ELEMENT);
      done();
    });
  });
});

describe('DatabaseService misc/utils', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = initService(DatabaseService);
  });

  it('checks for valid admin', async (done) => {
    const user = { id: data.TEST_ID } as cd.IUser;
    const collection = new TestCollection(FirebaseCollection.Admins);
    await collection.deleteAll();
    await collection.setDoc(user.id, user);
    service.checkIfAdminUser(user).subscribe(async (isAdmin) => {
      expect(isAdmin).toBe(true);
      await collection.deleteAll();
      done();
    });
  });

  it('writes an analytics event', async () => {
    const event = { id: data.TEST_ID } as cd.IExceptionEvent;
    const collection = new TestCollection<cd.IExceptionEvent>(FirebaseCollection.Exceptions);
    await collection.deleteAll();
    await service.writeAnalyticsEvent(event);
    const results = await collection.queryAll();
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(data.TEST_ID);
    await collection.deleteAll();
  });
});
