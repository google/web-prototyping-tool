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
import { getProjectState, IProjectState } from '../reducers';
import { IProjectDataState, initialState } from '../reducers/project-data.reducer';
import { IProject } from 'cd-interfaces';
import { getUser } from 'src/app/store/selectors/user.selector';

const projectSelector = (state: IProjectDataState): IProject | undefined => state.project;

export const getProjectDataState = createSelector(getProjectState, (state?: IProjectState) =>
  state ? state.projectData : initialState
);

export const getProjectDataLoaded = createSelector(
  getProjectDataState,
  (state: IProjectDataState) => state.projectDataLoaded
);

export const getProject = createSelector(
  getProjectDataState,
  (state: IProjectDataState) => state.project
);

export const getUserIsProjectOwner = createSelector(getProject, getUser, (project, user) => {
  const userId = user?.id;
  const ownerId = project?.owner.id;
  if (!userId || !ownerId) return false;
  return userId !== undefined && userId === ownerId;
});

export const getUserIsProjectEditor = createSelector(getProject, getUser, (project, user) => {
  const userId = user?.id;
  const userEmail = user?.email;
  const ownerId = project?.owner.id;
  if (!userId || !ownerId || !userEmail) return false;
  const editors = project?.editors ?? [];
  const ownsCurrentProject = userId !== undefined && userId === ownerId;
  return ownsCurrentProject || editors.includes(userEmail);
});

export const getHomeBoardId = createSelector(
  getProject,
  (projectData: IProject | undefined) => projectData && projectData.homeBoardId
);

export const getBoardsIds = createSelector(getProjectDataState, (state: IProjectDataState) =>
  state.project ? state.project.boardIds : []
);

export const getAssetsIds = createSelector(getProjectDataState, (state: IProjectDataState) =>
  state.project ? state.project.assetIds : []
);

export const getSymbolsIds = createSelector(getProjectDataState, (state: IProjectDataState) =>
  state.project && state.project.symbolIds ? state.project.symbolIds : []
);

export const getProjectName = createSelector(
  projectSelector,
  (project?: IProject) => project && project.name
);
