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

import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment.integration-tests';
import { generateIDWithLength } from 'cd-utils/guid';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestore, AngularFirestoreModule } from '@angular/fire/firestore';
import firebase from 'firebase/app';

// These utils are used to help test all DB utils, services, etc, using only
// the core Firestore API, to test against Angular Firestore and RxJS.

// Initialize Firebase for testing
firebase.initializeApp(environment.firebase);
const db = firebase.firestore();

type QueryFn = (
  ref: firebase.firestore.CollectionReference
) => firebase.firestore.CollectionReference;

/** Initializes and returns an Angular service. */
export const initService = (ServiceClass: any): any => {
  TestBed.configureTestingModule({
    imports: [AngularFireModule.initializeApp(environment.firebase), AngularFirestoreModule],
    declarations: [],
    providers: [AngularFirestore, ServiceClass],
  });
  return TestBed.inject(ServiceClass);
};

const UNIQUE_PREFIX_LENGTH = 6;
const PREFIX_LOCAL_STORAGE_KEY = 'integration-test-prefix';

/** Utility class for quickly testing a database collection. */
export class TestCollection<T> {
  /**
   * @param name - Collection name
   * @param forceUnique - Forces a unique collection by appending a unique suffix to the name.
   */
  constructor(public name: string, public forceUnique = false) {
    if (forceUnique) {
      // When forcing the use of unique collections, create a unique device ID
      // and store in local storage.  Then append that ID to the collection name.
      let deviceId = localStorage[PREFIX_LOCAL_STORAGE_KEY];
      if (!deviceId) {
        deviceId = generateIDWithLength(UNIQUE_PREFIX_LENGTH);
        localStorage[PREFIX_LOCAL_STORAGE_KEY] = deviceId;
      }
      this.name += '-' + deviceId;
    }
  }

  getDoc(id: string): Promise<T> {
    return getDoc(this.name, id);
  }

  setDoc(id: string, data: T) {
    return setDoc(this.name, id, data);
  }

  setAll(data: {}[]): Promise<void[]> {
    return setAll(this.name, data);
  }

  updateDoc(id: string, data: T) {
    return updateDoc(this.name, id, data);
  }

  deleteDoc(id: string) {
    return deleteDoc(this.name, id);
  }

  async queryAll(orderBy?: string): Promise<T[]> {
    return await queryAll<T>(this.name, orderBy);
  }

  async query(queryFn: QueryFn): Promise<T[]> {
    return await query<T>(this.name, queryFn);
  }

  deleteAll(ids?: string[]) {
    return deleteAll(this.name, ids);
  }

  getPath(id: string): string {
    return `${this.name}/${id}`;
  }
}

/** Gets a document using core firestore lib. */
export const getDoc = async <T extends any>(collection: string, id: string): Promise<T> => {
  const docRef = db.collection(collection).doc(id);
  const doc = await docRef.get();
  return doc.data() as T;
};

/** Sets a document using core firestore lib. */
export const setDoc = (collection: string, id: string, data: {}) => {
  return db.collection(collection).doc(id).set(data);
};

/** Sets an array of documents using core firestore lib. */
export const setAll = async (collection: string, data: {}[]): Promise<void[]> => {
  return await Promise.all(
    data.map((o: any) => {
      return db.collection(collection).doc(o.id).set(o);
    })
  );
};

/** Updates a document using core firestore lib. */
export const updateDoc = (collection: string, id: string, updates: {}) => {
  return db.collection(collection).doc(id).update(updates);
};

/** Gets all documents in collection using core firestore lib. */
export const queryAll = async <T extends any>(
  collection: string,
  orderBy?: string
): Promise<T[]> => {
  const ref = firebase.firestore().collection(collection);
  if (orderBy) ref.orderBy(orderBy);
  const snapshot = await ref.get();
  return snapshot.docs.map((o) => o.data()) as T[];
};

/** Gets all documents in collection using core firestore lib. */
export const query = async <T extends any>(collection: string, queryFn?: QueryFn): Promise<T[]> => {
  let ref = firebase.firestore().collection(collection);
  if (queryFn) ref = queryFn(ref);
  const snapshot = await ref.get();
  return snapshot.docs.map((o) => o.data()) as T[];
};

/** Deletes all documents from a specific collection. */
export const deleteDoc = (collection: string, id: string) => {
  return db.collection(collection).doc(id).delete();
};

/** Deletes all documents from a specific collection. */
export const deleteAll = async (collection: string, ids?: string[]) => {
  const col = firebase.firestore().collection(collection);
  if (ids) {
    for (const id of ids) {
      await col.doc(id).delete();
    }
  } else {
    const snapshot = await col.get();
    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
  }
};

/** Pause for n milliseconds. */
export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * A specialized spy that works with firestore methods.
 * Note: The out-of-the Jasmine spy throws an error.
 */
export class FirestoreSpy {
  firestore: any;
  docCalls = 0;
  collectionCalls = 0;

  constructor(service: any) {
    this.firestore = service['_afs'];
    this.firestore.spy = this;

    // Spy on doc()
    const origDoc = this.firestore.doc;
    this.firestore.doc = function () {
      this.spy.docCalls++;
      return origDoc.apply(this, arguments);
    };

    // Spy on collection()
    const origCollection = this.firestore.collection;
    this.firestore.collection = function () {
      this.spy.collectionCalls++;
      return origCollection.apply(this, arguments);
    };
  }
}
