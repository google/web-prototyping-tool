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
import * as data from './test/test-data';
import { projectContentsPathForId } from './path.utils';
// prettier-ignore
import { calcDatabaseUpdates, detectUndefinedObjects, BatchQueue } from './database.utils';

const ELEMENT_PROPS: cd.ElementPropertiesMap = {
  id1: { id: 'id1' } as cd.PropertyModel,
  id2: { id: 'id2' } as cd.PropertyModel,
  // id3 deleted
};
const PROJECT = data.TEST_PROJECT;
const CREATES_AND_DELETES = [{ id: 'id1' }] as cd.PropertyModel[];
const UPDATES = [{ elementId: 'id2', properties: {} }] as cd.IPropertiesUpdatePayload[];

describe('Database utils', () => {
  it('calculates database writes for creations/updates', () => {
    const [writePayload] = calcDatabaseUpdates(
      ELEMENT_PROPS,
      PROJECT,
      CREATES_AND_DELETES,
      UPDATES
    );
    expect(writePayload.size).toBe(2);
    expect(Array.from(writePayload.keys()).sort()).toEqual(toPaths(['id1', 'id2']));
  });

  it('calculates database writes for creations/updates/deletes', () => {
    const [writePayload, deleteSet] = calcDatabaseUpdates(
      ELEMENT_PROPS,
      PROJECT,
      [...CREATES_AND_DELETES, ...[{ id: 'id3' }]] as cd.PropertyModel[],
      UPDATES
    );
    expect(deleteSet.size).toBe(1);
    expect(Array.from(deleteSet).sort()).toEqual(toPaths(['id3']));
    expect(writePayload.size).toBe(2);
    expect(Array.from(writePayload.keys()).sort()).toEqual(toPaths(['id1', 'id2']));
  });

  it('detects undefined objects', () => {
    for (const obj of [
      { test: undefined },
      { test: [{ foo: undefined }] },
      { test: 123, foo: undefined },
      { test: 123, foo: { bar: undefined } },
      { foo: { bar: { baz: { test: undefined } } } },
    ]) {
      expect(detectUndefinedObjects(obj)).toBe(true);
    }
    for (const obj of [
      { test: 123 },
      { test: [{ foo: 'bar' }] },
      { test: 123, foo: 'baz' },
      { test: 123, foo: { bar: 'bar' } },
      { foo: { bar: { baz: { test: 'baz' } } } },
    ]) {
      expect(detectUndefinedObjects(obj)).toBe(false);
    }
  });
});

describe('BatchQueue', () => {
  let batchQueue: BatchQueue;
  let queue: Set<Symbol>;

  beforeEach(() => {
    batchQueue = new BatchQueue();
    queue = batchQueue['_queue'];
  });

  it('is properly initialized', () => {
    expect(queue.size).toBe(0);
  });

  it('sets active if queue is populated', () => {
    const s1 = Symbol();
    const s2 = Symbol();
    batchQueue.add(s1);
    expect(batchQueue.active).toBe(true);
    expect(queue.size).toBe(1);
    batchQueue.add(s2);
    expect(batchQueue.active).toBe(true);
    expect(queue.size).toBe(2);
    batchQueue.remove(s2);
    expect(batchQueue.active).toBe(true);
    expect(queue.size).toBe(1);
  });

  it('sets inactive if queue is empty', () => {
    const s1 = Symbol();
    batchQueue.add(s1);
    expect(batchQueue.active).toBe(true);
    expect(queue.size).toBe(1);
    batchQueue.remove(s1);
    expect(batchQueue.active).toBe(false);
    expect(queue.size).toBe(0);
  });
});

const toPaths = (ids: string[]): string[] => {
  return ids.map((id) => projectContentsPathForId(id));
};
