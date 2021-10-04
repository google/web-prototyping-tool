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
import { IProject } from 'cd-interfaces';
import { updateProjectKeywordsIfPartialContainsTitle } from 'cd-common/utils';
import { updateProjectTimestamp } from 'src/app/routes/project/utils/project.utils';
import { Theme } from 'cd-themes';

export const PROJECT = '[Project]';
// actions from user that trigger side effects into firestore
export const PROJECT_CREATE = `${PROJECT} create`;
export const PROJECT_CREATE_FROM_TEMPLATE = `${PROJECT} create from template`;
export const PROJECT_CREATE_SUCCESS = `${PROJECT} create success`;
export const PROJECT_CREATE_FAILURE = `${PROJECT} create failed`;

export const PROJECT_UPDATE = `${PROJECT} update`;
export const PROJECT_UPDATE_SUCCESS = `${PROJECT} update success`;
export const PROJECT_UPDATE_FAILURE = `${PROJECT} update failed`;

export const PROJECT_DELETE = `${PROJECT} delete`;
export const PROJECT_DELETE_SUCCESS = `${PROJECT} delete success`;
export const PROJECT_DELETE_FAILURE = `${PROJECT} delete failed`;
// User updates to project
export class ProjectCreate implements Action {
  readonly type = PROJECT_CREATE;
  constructor(public themeId: Theme) {}
}

export class ProjectCreateFromTemplate implements Action {
  readonly type = PROJECT_CREATE_FROM_TEMPLATE;
  constructor(public template: IProject) {}
}

export class ProjectCreateSuccess implements Action {
  readonly type = PROJECT_CREATE_SUCCESS;
  constructor(public payload: IProject, public themeId: Theme) {
    this.payload = updateProjectKeywordsIfPartialContainsTitle(this.payload) as IProject;
  }
}

export class ProjectCreateFailure implements Action {
  readonly type = PROJECT_CREATE_FAILURE;
  constructor() {}
}

export class ProjectUpdate implements Action {
  readonly type = PROJECT_UPDATE;
  constructor(public id: string, public changes: Partial<IProject>) {
    // These updates must occur here to get captured by the offline effect and written to firestore
    const changesWithKeywords = updateProjectKeywordsIfPartialContainsTitle(this.changes);
    this.changes = updateProjectTimestamp(changesWithKeywords);
  }
}

export class ProjectUpdateSuccess implements Action {
  readonly type = PROJECT_UPDATE_SUCCESS;
  constructor() {}
}

export class ProjectUpdateFailure implements Action {
  readonly type = PROJECT_UPDATE_FAILURE;
  constructor() {}
}

export class ProjectDelete implements Action {
  readonly type = PROJECT_DELETE;
  constructor(public payload: IProject) {}
}

export class ProjectDeleteSuccess implements Action {
  readonly type = PROJECT_DELETE_SUCCESS;
  constructor() {}
}

export class ProjectDeleteFailure implements Action {
  readonly type = PROJECT_DELETE_FAILURE;
  constructor() {}
}

export type ProjectAction =
  | ProjectCreate
  | ProjectCreateFromTemplate
  | ProjectCreateSuccess
  | ProjectCreateFailure
  | ProjectUpdate
  | ProjectUpdateSuccess
  | ProjectUpdateFailure
  | ProjectDelete
  | ProjectDeleteSuccess
  | ProjectDeleteFailure;
