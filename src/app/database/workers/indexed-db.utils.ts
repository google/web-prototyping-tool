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

import { get, set, del, clear, createStore } from 'idb-keyval';

/**
 * Name of  local IndexedDB.
 *
 * Note:
 * Anytime we need to do a database migration, version should be incremented. This will
 * effectively abandon any data stored in older versions of IndexedDB in user's browsers
 **/
const CD_DATABASE_NAME = 'IndexedDB - v3';
const CD_DATABASE_STORE_NAME = 'app';
const idbStore = createStore(CD_DATABASE_NAME, CD_DATABASE_STORE_NAME);

export const getIdbData = (key: string) => {
  return get<any>(key, idbStore);
};

export const setIdbData = (key: string, value: any) => {
  return set(key, value, idbStore);
};

export const deleteIdbData = (key: string) => {
  return del(key, idbStore);
};

export const clearIdbData = () => {
  return clear(idbStore);
};
