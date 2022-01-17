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

import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { generateIDWithLength } from 'cd-utils/guid';
import { deepCopy } from 'cd-utils/object';
import { data as mockData, enableStorageFor } from '../../database/test/firestore-mock.config';

const AFS_ID_LENGTH = 20;

const getObservableResponse = <T>(response: T): Observable<T> => of(response).pipe(delay(1));

const getEmptyPromiseResponse = () => new Promise((resolve) => setTimeout(resolve));

const emptyCollectionAccessor = () => ({
  where: emptyCollectionAccessor,

  stateChanges: () => {
    // Not modeling any collection results
    return getObservableResponse([]);
  },
  valueChanges: () => {
    return getObservableResponse([]);
  },
  get: () => {
    return getObservableResponse({
      docs: [],
    });
  },
  snapshotChanges: () => {
    return getObservableResponse([]);
  },
  onSnapshot: () => {},
});

@Injectable({
  providedIn: 'root',
})
export class AngularFirestoreMock {
  private _storedData: Record<string, any> = {};
  public firestore = {
    settings: () => {},

    batch: () => ({
      set: (path: string, data: any) => {
        this._updateFirstLevelMockDataForPath(path, data);
      },
      delete: () => {},
      commit: () => getEmptyPromiseResponse(),
    }),
    collection: emptyCollectionAccessor,
  };

  collection = emptyCollectionAccessor;

  constructor() {}

  doc = (path: string) => {
    return {
      ref: path,
      get: () => {
        const ret = this._getMockDataForPath(path);
        const { id } = ret;
        return getObservableResponse({ data: () => ret, id, exists: true });
      },
      set: (data: any) => {
        this._setMockDataForPath(path, data);
        return getEmptyPromiseResponse();
      },
      update: (data: any) => {
        // TODO : This only mimicks merging first level of data
        this._updateFirstLevelMockDataForPath(path, data);
        return getEmptyPromiseResponse();
      },
      delete: () => {
        return getEmptyPromiseResponse();
      },
    };
  };

  createId = () => generateIDWithLength(AFS_ID_LENGTH);

  private _getMockDataForPath = (path: string) => {
    if (mockData.hasOwnProperty(path)) return mockData[path];

    const [pathFirstLevel, id] = path.split('/');
    if (enableStorageFor.includes(pathFirstLevel)) {
      return Object.assign({ id }, this._storedData[path]);
    }

    return {};
  };

  private _setMockDataForPath = (path: string, data: any) => {
    const pathFirstLevel = path.split('/', 1)[0];
    if (enableStorageFor.includes(pathFirstLevel)) this._storedData[path] = data;

    return {};
  };

  // TODO : This only mimicks merging first level of data
  private _updateFirstLevelMockDataForPath = (path: string, data: any) => {
    const pathFirstLevel = path.split('/', 1)[0];
    if (enableStorageFor.includes(pathFirstLevel)) {
      const updatedData = deepCopy(this._storedData);

      for (const key of Object.keys(data)) {
        updatedData[path][key] = data[key];
      }

      this._storedData = updatedData;
    }

    return {};
  };
}
