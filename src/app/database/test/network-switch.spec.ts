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

import { NetworkSwitch } from './network-switch';
import { TestCollection, sleep } from './test.utils';
import * as data from './test-data';

const TEST_URL = window.location.origin;
const TEST_WS = 'ws://' + window.location.host;

describe('NetworkSwitch', () => {
  let network: NetworkSwitch;
  beforeEach(() => (network = new NetworkSwitch()));
  afterEach(() => network.enable());

  it('disables network HTTP calls', () => {
    network.disable();
    expect(() => fetch(TEST_URL)).toThrow();
    const xhr = new XMLHttpRequest();
    xhr.open('get', TEST_URL);
    expect(() => xhr.send()).toThrow();
  });

  it('enables network HTTP calls', () => {
    network.disable();
    network.enable();
    expect(() => fetch(TEST_URL)).not.toThrow();
    const xhr = new XMLHttpRequest();
    xhr.open('get', TEST_URL);
    expect(() => xhr.send()).not.toThrow();
  });

  it('disables websocket calls', () => {
    network.disable();
    const ws = new WebSocket(TEST_WS);
    expect(() => ws.send('data')).toThrow();
  });

  it('enables websocket calls', () => {
    network.disable();
    network.enable();
    const ws = new WebSocket(TEST_WS);
    try {
      ws.send('data');
    } catch (ex) {
      // Cannot connect to an actual ws server, so test for correct error
      expect(ex.message).toContain('Still in CONNECTING state');
    }
  });
});

describe('NetworkSwitch firebase', () => {
  const collection = new TestCollection<data.ITestDoc>(data.TEST_COLLECTION, true);
  const network = new NetworkSwitch();
  beforeEach(async () => await collection.deleteDoc(data.TEST_ID));
  afterEach(() => network.enable());

  // TODO: While this works, firebase oddly doesn't throw an error.
  // Will likely need to modify disable method to force and error.
  xit('disables firestore set calls', async () => {
    network.disable();
    collection.setDoc(data.TEST_ID, data.TEST_DOC);
    sleep(3000);
    network.enable();
    const result = await collection.getDoc(data.TEST_ID);
    expect(result).toBeUndefined();
  });
});
