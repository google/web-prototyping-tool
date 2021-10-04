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

import { QueryService, IQueryResult } from './query.service';
import { initService, TestCollection } from './test/test.utils';
import * as data from './test/test-data';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';

describe('QueryService', () => {
  const collection = new TestCollection<data.ITestDoc>(data.TEST_COLLECTION, true);
  let service: QueryService;

  beforeEach(async () => {
    service = initService(QueryService);
    await collection.deleteAll();
  });

  afterAll(async () => await collection.deleteAll());

  it('queries all in a collection', async (done) => {
    await Promise.all(data.TEST_DOCS_ARRAY.map((doc: any) => collection.setDoc(doc.id, doc)));
    service
      .getCollection<data.ITestDoc>(collection.name)
      .subscribe((docs: IQueryResult<data.ITestDoc>[]) => {
        expect(docs.length).toBe(data.TEST_DOCS_ARRAY.length);
        const ids = docs.map((o) => o.data.id).sort();
        const expectedIds = data.TEST_DOCS_ARRAY.map((o) => o.id).sort();
        expect(ids).toEqual(expectedIds);
        done();
      });
  });

  it('queries a sorted collection', async (done) => {
    await Promise.all(data.TEST_DOCS_ARRAY.map((doc: any) => collection.setDoc(doc.id, doc)));
    service
      .getCollection<data.ITestDoc>(collection.name, (ref) => ref.orderBy('id', 'desc'))
      .subscribe((docs: IQueryResult<data.ITestDoc>[]) => {
        expect(docs.length).toBe(data.TEST_DOCS_ARRAY.length);
        expect(docs[0].data.id).toEqual(data.TEST_DOC3.id);
        expect(docs[2].data.id).toEqual(data.TEST_DOC.id);
        done();
      });
  });

  it('queries a collection with where clause', async (done) => {
    await Promise.all(data.TEST_DOCS_ARRAY.map((doc: any) => collection.setDoc(doc.id, doc)));
    service
      .getCollection<data.ITestDoc>(collection.name, (ref) => ref.where('count', '>', 1))
      .subscribe((docs: IQueryResult<data.ITestDoc>[]) => {
        expect(docs.length).toBe(2);
        expect(docs[0].data.count).toEqual(2);
        expect(docs[1].data.count).toEqual(3);
        done();
      });
  });

  it('extracts username from query', () => {
    expect(service.usernameFromQuery('test@google.com')).toBe('test@google.com');
    expect(service.usernameFromQuery('owner:test@google.com')).toBe('test@google.com');
    expect(service.usernameFromQuery('owner:test')).toBe('test');
    expect(service.usernameFromQuery('test')).toBeUndefined();
    expect(service.usernameFromQuery('owner:')).toBe('');
  });

  it('queries documents by user', async (done) => {
    const projectCollection = new TestCollection<cd.IProject>(consts.FirebaseCollection.Projects);
    await projectCollection.setDoc(data.TEST_PROJECT_ID, data.TEST_PROJECT);
    service
      .getCollection<cd.IProject>(consts.FirebaseCollection.Projects, (ref) =>
        service.buildUsernameSearchQuery(ref, data.TEST_USER_NAME)
      )
      .subscribe((results) => {
        expect(results.length).toBe(1);
        const project = results[0];
        expect(project.data.id).toBe(data.TEST_PROJECT_ID);
        done();
      });
  });
});
