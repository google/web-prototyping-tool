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
import { ComponentQueryService } from './component-query.service';
import { IPublishEntryQueryResult } from './query.service';
import { FirebaseCollection } from 'cd-common/consts';
import firebase from 'firebase/app';

const collection = new TestCollection<cd.IPublishEntry>(FirebaseCollection.PublishEntries);

describe('ComponentQueryService', () => {
  let service: ComponentQueryService;

  beforeEach(() => (service = initService(ComponentQueryService)));

  it('loads all publish entries and set values', async (done) => {
    const [componentId, symbolId] = await addTestEntries();
    service.onRequestComplete = async (publishEntryResults: IPublishEntryQueryResult[]) => {
      const publishEntries = publishEntryResults.map((o) => o.data);
      expect(publishEntries).not.toBeUndefined();
      const cmp = publishEntries.find((o) => o.id === componentId);
      expect(cmp).not.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(cmp!.type).toBe(cd.PublishType.CodeComponent);
      const sym = publishEntries.find((o) => o.id === symbolId);
      expect(sym).not.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(sym!.type).toBe(cd.PublishType.Symbol);
      await collection.deleteAll([componentId, symbolId]);
      done();
    };
    service.loadAllSortedByDateWithLimit();
  });

  it('removes entry from published list', async (done) => {
    const [componentId, symbolId] = await addTestEntries();
    const originalOnRequestComplete = service.onRequestComplete;
    service.onRequestComplete = async (publishEntryResults: IPublishEntryQueryResult[]) => {
      originalOnRequestComplete(publishEntryResults);
      service.removeEntryFromList(componentId);
      const publishEntries = [...service.publishedComponents$.getValue()].map((o) => o.data);
      expect(publishEntries.find((o) => o.id === componentId)).toBeUndefined();
      await collection.deleteAll([componentId, symbolId]);
      done();
    };
    service.loadAllSortedByDateWithLimit();
  });
});

const addTestEntries = async (): Promise<[string, string]> => {
  const componentId = generateIDWithLength();
  const symbolId = generateIDWithLength();
  await collection.setDoc(componentId, {
    id: componentId,
    type: cd.PublishType.CodeComponent,
    updatedAt: firebase.firestore.Timestamp.now(),
  } as cd.IPublishEntry);
  await collection.setDoc(symbolId, {
    id: symbolId,
    type: cd.PublishType.Symbol,
    updatedAt: firebase.firestore.Timestamp.now(),
  } as cd.IPublishEntry);
  return [componentId, symbolId];
};
