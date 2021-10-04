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
import { generateIDWithLength } from 'cd-utils/guid';
import { initService, TestCollection } from './test/test.utils';
import * as data from './test/test-data';
import { ComponentSearchService } from './component-search.service';
import { IPublishEntryQueryResult } from './query.service';
import { FirebaseCollection } from 'cd-common/consts';
import firebase from 'firebase/app';

const collection = new TestCollection<cd.IPublishEntry>(FirebaseCollection.PublishEntries);

describe('ComponentSearchService', () => {
  let service: ComponentSearchService;
  let ids: string[];

  beforeEach(async () => {
    service = initService(ComponentSearchService);
    ids = await addTestEntries();
  });

  afterEach(async () => await collection.deleteAll(ids));

  it('searches for published components', (done) => {
    service.onUserRequestComplete = (publishEntryResults: IPublishEntryQueryResult[]) => {
      expect(publishEntryResults).not.toBeUndefined();
      const publishEntries = publishEntryResults.map((o) => o.data);
      expect(publishEntries.length).toBeGreaterThanOrEqual(1);
      const entry = publishEntries[0];
      expect(publishEntries[0].owner.id).toBe(data.TEST_USER_ID);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(entry.keywords![0]).toBe('foo');
      done();
    };
    service.searchForPublishedComponents(data.TEST_USER_IDENTITY, 'foo');
  });

  it('searches for published components by username', (done) => {
    service.onOthersRequestComplete = (publishEntryResults: IPublishEntryQueryResult[]) => {
      expect(publishEntryResults).not.toBeUndefined();
      const publishEntries = publishEntryResults.map((o) => o.data);
      expect(publishEntries.length).toBeGreaterThanOrEqual(2);
      expect(publishEntries[0].owner.id).toBe(data.TEST_USER_ID);
      expect(publishEntries[1].owner.id).toBe(data.TEST_USER_ID);
      done();
    };
    service.searchForPublishedComponentsByUsername(data.TEST_USER_NAME, data.TEST_USER_IDENTITY);
  });

  it('searches for published components by username with no results', (done) => {
    service.onOthersRequestComplete = (publishEntryResults: IPublishEntryQueryResult[]) => {
      expect(publishEntryResults).not.toBeUndefined();
      expect(publishEntryResults.length).toBe(0);
      done();
    };
    service.searchForPublishedComponentsByUsername('fake-user', data.TEST_USER_IDENTITY);
  });

  it('searches others published components', (done) => {
    service.onOthersRequestComplete = (publishEntryResults: IPublishEntryQueryResult[]) => {
      expect(publishEntryResults).not.toBeUndefined();
      const publishEntries = publishEntryResults.map((o) => o.data);
      expect(publishEntries.length).toBeGreaterThanOrEqual(1);
      const entry = publishEntries[0];
      expect(publishEntries[0].owner.id).toBe(data.TEST_USER_ID2);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(entry.keywords![0]).toBe('baz');
      done();
    };
    service.searchOthersPublishedComponents('baz', data.TEST_USER_ID);
  });

  it('searches others published components with no results', (done) => {
    service.onOthersRequestComplete = (publishEntryResults: IPublishEntryQueryResult[]) => {
      expect(publishEntryResults).not.toBeUndefined();
      expect(publishEntryResults.length).toBe(0);
      done();
    };
    service.searchOthersPublishedComponents('na', data.TEST_USER_ID);
  });

  it('searches for own published components', (done) => {
    service.onUserRequestComplete = (publishEntryResults: IPublishEntryQueryResult[]) => {
      expect(publishEntryResults).not.toBeUndefined();
      const publishEntries = publishEntryResults.map((o) => o.data);
      expect(publishEntries.length).toBeGreaterThanOrEqual(1);
      const entry = publishEntries[0];
      expect(publishEntries[0].owner.id).toBe(data.TEST_USER_ID2);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(entry.keywords![0]).toBe('test');
      done();
    };
    service.searchOwnPublishedComponents('test', data.TEST_USER_ID2);
  });

  it('searches for own published components with no results', (done) => {
    service.onUserRequestComplete = (publishEntryResults: IPublishEntryQueryResult[]) => {
      expect(publishEntryResults).not.toBeUndefined();
      expect(publishEntryResults.length).toBe(0);
      done();
    };
    service.searchOwnPublishedComponents('test', data.TEST_USER_ID);
  });
});

const addTestEntries = async (): Promise<string[]> => {
  const componentId = generateIDWithLength();
  await collection.setDoc(componentId, {
    id: componentId,
    type: cd.PublishType.CodeComponent,
    updatedAt: firebase.firestore.Timestamp.now(),
    owner: data.TEST_USER_IDENTITY,
    keywords: ['foo'],
  } as cd.IPublishEntry);

  const symbolId = generateIDWithLength();
  await collection.setDoc(symbolId, {
    id: symbolId,
    type: cd.PublishType.Symbol,
    updatedAt: firebase.firestore.Timestamp.now(),
    owner: data.TEST_USER_IDENTITY,
    keywords: ['bar'],
  } as cd.IPublishEntry);

  const componentId2 = generateIDWithLength();
  await collection.setDoc(componentId2, {
    id: componentId2,
    type: cd.PublishType.CodeComponent,
    updatedAt: firebase.firestore.Timestamp.now(),
    owner: data.TEST_USER_IDENTITY2,
    keywords: ['baz'],
  } as cd.IPublishEntry);

  const symbolId2 = generateIDWithLength();
  await collection.setDoc(symbolId2, {
    id: symbolId2,
    type: cd.PublishType.Symbol,
    updatedAt: firebase.firestore.Timestamp.now(),
    owner: data.TEST_USER_IDENTITY2,
    keywords: ['test'],
  } as cd.IPublishEntry);
  return [componentId, symbolId, componentId2, symbolId2];
};
