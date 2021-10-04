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

import { Action } from '@ngrx/store';
import { UndoableStateSliceNames } from '../configs/history.config';
import { IProjectState } from '../store/reducers';

export type UndoableStateSlices = Pick<IProjectState, UndoableStateSliceNames>;

export interface IHistoryItem {
  state: UndoableStateSlices;
  action: Action;
}

export interface IHistoryState {
  past: IHistoryItem[];
  current: IHistoryItem | undefined;
  future: IHistoryItem[];
  undoneAction: Action | null; // Effects use this to undo side effects
}
