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

import * as projectActions from '../actions/project-data.action';
import { IReducerFunctionLookup, IProject } from 'cd-interfaces';
import { isBoard, isSymbolDefinition, getModelEntries } from 'cd-common/models';
import {
  ElementPropertiesCreate,
  ELEMENT_PROPS_CREATE,
  ElementPropertiesDelete,
  ELEMENT_PROPS_DELETE,
  ELEMENT_PROPS_SET_ALL,
  ElementPropertiesSetAll,
} from '../actions';

export interface IProjectDataState {
  projectDataLoaded: boolean;
  project?: IProject;
  isCurrentUserOwner?: boolean;
}

export const initialState: IProjectDataState = {
  projectDataLoaded: false,
};

const handleProjectUpdate = (
  state: IProjectDataState,
  action: projectActions.ProjectDataUpdate
): IProjectDataState => {
  // TODO : this doesn't guard against updating an undefined project
  // Intial state should probably have empty project that unauthenticated
  // user can manipulate as playground.
  const project = { ...state.project, ...action.payload } as IProject;
  return { ...state, project };
};

const handleProjectDeleteHomeBoard = (
  state: IProjectDataState,
  _action: projectActions.ProjectDataDeleteHomeBoard
): IProjectDataState => {
  if (!state.project) return state;

  const project = { ...state.project };
  delete project.homeBoardId;

  return { ...state, project };
};

const handleProjectQuerySuccess = (
  state: IProjectDataState,
  action: projectActions.ProjectDataQuerySuccess
): IProjectDataState => {
  return {
    ...state,
    projectDataLoaded: true,
    project: { ...action.projectData, id: action.projectId },
  };
};

/**
 * Anytime a board or symbol is created, add it to list of boardIds/symbolIds
 */
const handleElementPropertiesCreate = (
  state: IProjectDataState,
  { payload }: ElementPropertiesCreate
): IProjectDataState => {
  const { project } = state;
  if (!project) return state;
  let newBoardIds: string[] | undefined;
  let newSymbolIds: string[] | undefined;

  for (const propertyModel of payload) {
    if (isBoard(propertyModel)) {
      // only clone array if needed
      if (!newBoardIds) {
        newBoardIds = [...project.boardIds];
      }

      newBoardIds.push(propertyModel.id);
    }

    if (isSymbolDefinition(propertyModel)) {
      // only clone array if needed
      if (!newSymbolIds) {
        newSymbolIds = [...project.symbolIds];
      }

      newSymbolIds.push(propertyModel.id);
    }
  }
  if (!newBoardIds && !newSymbolIds) return state;

  return {
    ...state,
    project: {
      ...project,
      boardIds: newBoardIds || project.boardIds,
      symbolIds: newSymbolIds || project.symbolIds,
    },
  };
};

/**
 * Anytime a board or symbol is deleted, remove it from list of boardIds/symbolIds
 */
const handleElementPropertiesDelete = (
  state: IProjectDataState,
  { payload }: ElementPropertiesDelete
): IProjectDataState => {
  const { project } = state;
  if (!project || !payload) return state;
  let newBoardIds: string[] | undefined;
  let newSymbolIds: string[] | undefined;

  for (const model of payload) {
    if (isBoard(model)) {
      // only clone array if needed
      if (!newBoardIds) {
        newBoardIds = [...project.boardIds];
      }

      const index = newBoardIds.indexOf(model.id);
      newBoardIds.splice(index, 1);
    }

    if (isSymbolDefinition(model)) {
      // only clone array if needed
      if (!newSymbolIds) {
        newSymbolIds = [...project.symbolIds];
      }

      const index = newSymbolIds.indexOf(model.id);
      newSymbolIds.splice(index, 1);
    }
  }
  if (!newBoardIds && !newSymbolIds) return state;

  return {
    ...state,
    project: {
      ...project,
      boardIds: newBoardIds || project.boardIds,
      symbolIds: newSymbolIds || project.symbolIds,
    },
  };
};

/**
 * On action for set all element properties, recompute boardIds and symbolIds
 */
const handleElementPropertiesSetAll = (
  state: IProjectDataState,
  { elementProperties }: ElementPropertiesSetAll
): IProjectDataState => {
  const { project } = state;
  if (!project) return state;
  const elementEntries = getModelEntries(elementProperties);
  const boardIds: string[] = [];
  const symbolIds: string[] = [];

  // HOTFIX - filter out any element from another project id
  const filteredEntries = elementEntries.filter(([, model]) => model.projectId === project.id);

  for (const [id, model] of filteredEntries) {
    if (isBoard(model)) {
      boardIds.push(id);
    } else if (isSymbolDefinition(model)) {
      symbolIds.push(id);
    }
  }

  return { ...state, project: { ...project, boardIds, symbolIds } };
};

const handleUserIsOwner = (
  state: IProjectDataState,
  { isOwner: isCurrentUserOwner }: projectActions.ProjectDataCurrentUserIsOwner
): IProjectDataState => ({ ...state, isCurrentUserOwner });

const lookup: IReducerFunctionLookup = {
  [projectActions.PROJECT_DATA_UPDATE]: handleProjectUpdate,
  [projectActions.PROJECT_DATA_DELETE_HOME_BOARD]: handleProjectDeleteHomeBoard,
  [projectActions.PROJECT_DATA_QUERY_SUCCESS]: handleProjectQuerySuccess,
  [projectActions.PROJECT_DATA_CURRENT_USER_IS_OWNER]: handleUserIsOwner,
  [ELEMENT_PROPS_CREATE]: handleElementPropertiesCreate,
  [ELEMENT_PROPS_DELETE]: handleElementPropertiesDelete,
  [ELEMENT_PROPS_SET_ALL]: handleElementPropertiesSetAll,
};

export function reducer(
  state: IProjectDataState = initialState,
  action: projectActions.ProjectDataAction
) {
  return action.type in lookup ? lookup[action.type](state, action) : state;
}
