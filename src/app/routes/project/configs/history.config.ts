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

import { IHistoryState } from '../interfaces/history.interface';

// This is an enum, but it actually configs what states are undoable.
// Using a enum simplifies interface definitions/utils while
// enforcing types
// (i.e. that these slice names have to be defined keys in IProjectState)
export enum UndoableStateSliceNames {
  Selection = 'selection',
}

export const initialHistoryState: IHistoryState = {
  past: [],
  current: undefined,
  future: [],
  undoneAction: null,
};
