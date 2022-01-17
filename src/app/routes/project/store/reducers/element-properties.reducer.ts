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
import { mergeUpdatesIntoElementProperties } from 'cd-common/utils';
import { ProjectContentQuerySuccess, PROJECT_CONTENT_QUERY_SUCCESS } from '../actions';
import * as actions from '../actions/element-properties.action';

export interface IComponentInstanceState {
  loaded: boolean;
  lastUpdatedIds: Set<string>;
  elementProperties: cd.ElementPropertiesMap;
}

export const initialState: IComponentInstanceState = {
  loaded: false,
  lastUpdatedIds: new Set(),
  elementProperties: {},
};

const handleRemoteRemoved = (
  state: IComponentInstanceState,
  action: actions.ElementPropertiesRemoteRemoved
): IComponentInstanceState => {
  const elementProperties = { ...state.elementProperties };
  const propertyModel = action.payload;
  const { id } = propertyModel;
  const lastUpdatedIds = new Set<string>(id);
  delete elementProperties[id];

  return { ...state, lastUpdatedIds, elementProperties };
};

const handleCreate = (
  state: IComponentInstanceState,
  action: actions.ElementPropertiesCreate | actions.ElementPropertiesRemoteAdd
): IComponentInstanceState => {
  const elementProperties = { ...state.elementProperties };
  const lastUpdatedIds = new Set<string>();

  for (const propertyModel of action.payload) {
    const { id } = propertyModel;
    lastUpdatedIds.add(id);
    elementProperties[id] = propertyModel;
  }

  const stateWithCreate = { ...state, lastUpdatedIds, elementProperties };

  // If there are any updates as part of the create action,
  // apply them after the created models have been added.
  const createAction = action as actions.ElementPropertiesCreate;
  const updates = createAction.updates || [];
  const deletions = createAction.deletions || [];

  const updateAction = new actions.ElementPropertiesUpdate(updates);
  const updatesStateUpdate = handleUpdate(stateWithCreate, updateAction);

  const deleteAction = new actions.ElementPropertiesDelete(deletions);
  const deletesStateUpdate = handleDelete(updatesStateUpdate, deleteAction);

  const allUpdatedIds = new Set<string>([
    ...lastUpdatedIds,
    ...updatesStateUpdate.lastUpdatedIds,
    ...deletesStateUpdate.lastUpdatedIds,
  ]);
  return { ...deletesStateUpdate, lastUpdatedIds: allUpdatedIds };
};

const handleUpdate = (
  state: IComponentInstanceState,
  { payload }: actions.ElementPropertiesUpdate
): IComponentInstanceState => {
  const { elementProperties, updatedIds: lastUpdatedIds } = mergeUpdatesIntoElementProperties(
    payload,
    state.elementProperties
  );
  return { ...state, lastUpdatedIds, elementProperties };
};

const handleDelete = (
  state: IComponentInstanceState,
  { payload, updates }: actions.ElementPropertiesDelete
): IComponentInstanceState => {
  if (!payload) return state;

  // apply any updates that occured with this delete
  // e.g. moving children, updating positions, etc
  const updateAction = updates && new actions.ElementPropertiesUpdate(updates);
  const stateUpdate = updateAction ? handleUpdate(state, updateAction) : state;
  const elementProperties = { ...stateUpdate.elementProperties };
  const lastUpdatedIds = updates ? stateUpdate.lastUpdatedIds : new Set<string>();

  for (const model of payload) {
    const { id, parentId } = model;

    // remove item
    lastUpdatedIds.add(id);
    delete elementProperties[id];

    // if element has a parent (e.g. not a board).
    // then we need to remove id from childIds of parent
    if (parentId && elementProperties[parentId]) {
      const parentProps = elementProperties[parentId] as cd.PropertyModel;
      const childIds = [...parentProps.childIds];
      const childIndex = childIds.findIndex((val) => val === id);
      if (childIndex === -1) continue;
      childIds.splice(childIndex, 1);
      lastUpdatedIds.add(parentId);
      elementProperties[parentId] = { ...parentProps, childIds };
    }
  }

  return { ...state, lastUpdatedIds, elementProperties };
};

const handleSetAll = (
  state: IComponentInstanceState,
  payload: actions.ElementPropertiesSetAll | actions.ElementPropertiesReplaceAll
): IComponentInstanceState => {
  const { elementProperties } = payload;
  return { ...state, elementProperties };
};

// Used by history (undo/redo) meta reducer
const resetDerivedFieldsFromPropertiesUpdate = (
  state: IComponentInstanceState,
  { payload }: actions.ElementPropertiesUpdate
): IComponentInstanceState => {
  const lastUpdatedIds = new Set(payload.map(({ elementId }) => elementId));
  return { ...state, lastUpdatedIds };
};

const handleProjectContentQuerySuccess = (
  state: IComponentInstanceState,
  _action: ProjectContentQuerySuccess
): IComponentInstanceState => ({ ...state, loaded: true });

const lookup: cd.IReducerFunctionLookup = {
  [actions.ELEMENT_PROPS_REMOTE_ADDED]: handleCreate,
  [actions.ELEMENT_PROPS_REMOTE_REMOVED]: handleRemoteRemoved,
  [actions.ELEMENT_PROPS_CREATE]: handleCreate,
  [actions.ELEMENT_PROPS_UPDATE]: handleUpdate,
  [actions.ELEMENT_PROPS_DELETE]: handleDelete,
  [actions.ELEMENT_PROPS_SET_ALL]: handleSetAll,
  [actions.ELEMENT_PROPS_REPLACE_ALL]: handleSetAll,
  [PROJECT_CONTENT_QUERY_SUCCESS]: handleProjectContentQuerySuccess,
};

export function reducer(
  state: IComponentInstanceState = initialState,
  action: actions.ElementPropertiesAction
) {
  return action.type in lookup ? lookup[action.type](state, action) : state;
}

const resetDerivedFieldsLookup: cd.IReducerFunctionLookup = {
  [actions.ELEMENT_PROPS_UPDATE]: resetDerivedFieldsFromPropertiesUpdate,
};

export function resetDerivedFields(
  state: IComponentInstanceState,
  action: actions.ElementPropertiesAction
) {
  return action.type in resetDerivedFieldsLookup
    ? resetDerivedFieldsLookup[action.type](state, action)
    : state;
}
