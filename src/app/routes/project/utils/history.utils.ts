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
import { IHistoryState, UndoableStateSlices, IHistoryItem } from '../interfaces/history.interface';
import { IUndoableAction } from '../interfaces/action.interface';
import { IProjectState } from '../store/reducers';
import { HistoryInitSentinel } from '../store/actions/history.action';

// prettier-ignore
export const getUndoableStateSlices = (projState: IProjectState): UndoableStateSlices => ({
  [UndoableStateSliceNames.DesignSystem]: { ...projState[UndoableStateSliceNames.DesignSystem] },
  [UndoableStateSliceNames.ProjectData]: { ...projState[UndoableStateSliceNames.ProjectData] },
  [UndoableStateSliceNames.Selection]: { ...projState[UndoableStateSliceNames.Selection] },
  [UndoableStateSliceNames.ElementProperties]: { ...projState[UndoableStateSliceNames.ElementProperties] },
  [UndoableStateSliceNames.CodeComponents]: { ...projState[UndoableStateSliceNames.CodeComponents] },
});

export const isUndoableAction = (action: Action) => (action as IUndoableAction).undoable;

export const getHistoryNotChangedState = (state: IHistoryState): IHistoryState => ({
  ...state,
  undoneAction: null,
});

export const mergeCurrentState = (
  current: IHistoryItem | undefined,
  projState: IProjectState
): IHistoryItem => {
  const action = current ? current.action : new HistoryInitSentinel();
  const state = getUndoableStateSlices(projState);
  return { state, action };
};
