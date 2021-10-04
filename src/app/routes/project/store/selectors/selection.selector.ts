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

import { ISelectionState } from '../reducers/selection.reducer';
import { createSelector } from '@ngrx/store';
import { IProjectState, getProjectState } from '../reducers';

export const getSelectionState = createSelector(
  getProjectState,
  (state: IProjectState) => state.selection
);

export const getSelectedIds = createSelector(
  getSelectionState,
  (state: ISelectionState) => state.ids
);

export const getSelectionType = createSelector(
  getSelectionState,
  (state: ISelectionState) => state.type
);

export const getAreOutletFramesSelected = createSelector(
  getSelectionState,
  (state: ISelectionState) => state.outletFramesSelected
);

export const getAreSymbolInstancesSelected = createSelector(
  getSelectionState,
  (state: ISelectionState) => state.symbolInstancesSelected
);
