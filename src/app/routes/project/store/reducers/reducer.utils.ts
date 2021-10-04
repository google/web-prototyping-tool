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

import { ELEMENT_PROPS_SET_ALL } from '../actions/element-properties.action';
import { HISTORY_UNDO, HISTORY_REDO } from '../actions/history.action';
import { OFFLINE_WRITE_TO_LOCAL_DB } from '../actions/offline.action';

const CRUD = ['create', 'update', 'delete'];
const OFFLINE = [
  ...CRUD,
  ELEMENT_PROPS_SET_ALL,
  HISTORY_UNDO,
  HISTORY_REDO,
  OFFLINE_WRITE_TO_LOCAL_DB,
];

export const checkCrudActions = (actionType: string): boolean => {
  return CRUD.some((item) => actionType.includes(item));
};

// Test if this is an action that should trigger writing to the local IndexedDB
export const checkOfflineActions = (actionType: string): boolean => {
  return OFFLINE.some((item) => actionType.includes(item));
};
