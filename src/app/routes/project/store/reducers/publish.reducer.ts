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

import * as cd from 'cd-interfaces';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import * as actions from '../actions';

export const publishMetadataAdapter = createEntityAdapter<cd.IPublishEntry>();

export interface IPublishState extends EntityState<cd.IPublishEntry> {}

export const initialState: IPublishState = publishMetadataAdapter.getInitialState();

const handlePublishEntriesLoaded = (
  state: IPublishState,
  { payload }: actions.PublishEntriesLoaded
): IPublishState => {
  return publishMetadataAdapter.upsertMany(payload, state);
};

const handlePublishEntryUpdate = (
  state: IPublishState,
  { id, update }: actions.PublishEntryUpdate
): IPublishState => {
  const currentEntry = state.entities[id];
  if (!currentEntry) return state;
  const changes: Partial<cd.IPublishEntry> = update;
  return publishMetadataAdapter.updateOne({ id, changes }, state);
};

const handlePublishEntryDelete = (
  state: IPublishState,
  { publishEntry }: actions.PublishEntryDelete
): IPublishState => publishMetadataAdapter.removeOne(publishEntry.id, state);

const handleCodeComponentDelete = (
  state: IPublishState,
  { codeComponent, removePublishEntry }: actions.CodeComponentDelete
): IPublishState => {
  if (!removePublishEntry) return state;
  const { publishId } = codeComponent;
  if (!publishId) return state;
  return publishMetadataAdapter.removeOne(publishId.entryId, state);
};

const handleSymbolDelete = (
  state: IPublishState,
  { payload, removePublishEntry }: actions.SymbolDelete
): IPublishState => {
  if (!removePublishEntry) return state;
  const { publishId } = payload;
  if (!publishId) return state;
  return publishMetadataAdapter.removeOne(publishId.entryId, state);
};

const lookup: cd.IReducerFunctionLookup = {
  [actions.PUBLISH_ENTRIES_LOADED]: handlePublishEntriesLoaded,
  [actions.PUBLISH_ENTRY_UPDATE]: handlePublishEntryUpdate,
  [actions.PUBLISH_ENTRY_DELETE]: handlePublishEntryDelete,
  [actions.CODE_COMPONENT_DELETE]: handleCodeComponentDelete,
  [actions.SYMBOL_DELETE]: handleSymbolDelete,
};

export function reducer(state: IPublishState = initialState, action: actions.PublishAction) {
  return action.type in lookup ? lookup[action.type](state, action) : state;
}
