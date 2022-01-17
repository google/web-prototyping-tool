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

import type * as cd from 'cd-interfaces';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import * as actions from '../actions';

export const datasetsAdapter = createEntityAdapter<cd.ProjectDataset>();

export interface IDatasetsState extends EntityState<cd.ProjectDataset> {}

export const initialState: IDatasetsState = datasetsAdapter.getInitialState();

const handleDatasetAdd = (
  state: IDatasetsState,
  { datasets }: actions.DatasetCreate | actions.DatasetRemoteAdd
): IDatasetsState => {
  return datasetsAdapter.addMany(datasets, state);
};

const handleDatasetUpdate = (
  state: IDatasetsState,
  { id, changes }: actions.DatasetUpdate
): IDatasetsState => {
  return datasetsAdapter.updateOne({ id, changes }, state);
};

const handleDatasetDelete = (
  state: IDatasetsState,
  { dataset }: actions.DatasetDelete
): IDatasetsState => {
  return datasetsAdapter.removeOne(dataset.id, state);
};

const lookup: cd.IReducerFunctionLookup = {
  [actions.DATASET_CREATE]: handleDatasetAdd,
  [actions.DATASET_UPDATE]: handleDatasetUpdate,
  [actions.DATASET_DELETE]: handleDatasetDelete,
  [actions.DATASET_REMOTE_ADD]: handleDatasetAdd,
};

export function reducer(state: IDatasetsState = initialState, action: actions.DatasetAction) {
  return action.type in lookup ? lookup[action.type](state, action) : state;
}
