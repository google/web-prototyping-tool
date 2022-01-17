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

import { createSelector } from '@ngrx/store';
import { IProjectState, getProjectState } from '../reducers';
import { codeComponentAdapter, initialState } from '../reducers/code-component.reducer';

export const getCodeComponentState = createSelector(
  getProjectState,
  (state?: IProjectState) => state?.codeComponents || initialState
);

const { selectIds, selectEntities, selectAll, selectTotal } =
  codeComponentAdapter.getSelectors(getCodeComponentState);

export const selectCodeComponentIds = selectIds;
export const selectCodeComponents = selectEntities;
export const selectCodeComponentsArray = selectAll;
export const selectTotalCodeComponents = selectTotal;
