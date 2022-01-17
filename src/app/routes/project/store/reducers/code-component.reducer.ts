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
import { registerCodeComponent, unRegisterCodeComponent } from 'cd-common/models';
import { deepMerge } from 'cd-common/utils';

export const codeComponentAdapter = createEntityAdapter<cd.ICodeComponentDocument>();

export interface ICodeComponentState extends EntityState<cd.ICodeComponentDocument> {}

export const initialState: ICodeComponentState = codeComponentAdapter.getInitialState();

const handleCodeComponentAdd = (
  state: ICodeComponentState,
  { codeComponents }: actions.CodeComponentCreate | actions.CodeComponentRemoteAdd
): ICodeComponentState => {
  // anytime a code component is added to the store, add it to the component registry also
  for (const cmp of codeComponents) {
    registerCodeComponent(cmp);
  }

  return codeComponentAdapter.addMany(codeComponents, state);
};

const handleCodeComponentUpdate = (
  state: ICodeComponentState,
  { id, update }: actions.CodeComponentUpdate
): ICodeComponentState => {
  const currentEntry = state.entities[id];
  if (!currentEntry) return state;

  const changes = deepMerge(currentEntry, update) as cd.ICodeComponentDocument;

  // anytime a code component is updated in the store, update it in the component registry also
  registerCodeComponent(changes);

  return codeComponentAdapter.updateOne({ id, changes }, state);
};

const handleCodeComponentDelete = (
  state: ICodeComponentState,
  { codeComponent }: actions.CodeComponentDelete
): ICodeComponentState => {
  // anytime a code component is deleted from the store, delete it from the component registry also
  unRegisterCodeComponent(codeComponent.id);

  return codeComponentAdapter.removeOne(codeComponent.id, state);
};

const lookup: cd.IReducerFunctionLookup = {
  [actions.CODE_COMPONENT_CREATE]: handleCodeComponentAdd,
  [actions.CODE_COMPONENT_UPDATE]: handleCodeComponentUpdate,
  [actions.CODE_COMPONENT_DELETE]: handleCodeComponentDelete,
  [actions.CODE_COMPONENT_REMOTE_ADD]: handleCodeComponentAdd,
};

export function reducer(
  state: ICodeComponentState = initialState,
  action: actions.CodeComponentAction
) {
  return action.type in lookup ? lookup[action.type](state, action) : state;
}
