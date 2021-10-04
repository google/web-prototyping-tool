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
import { IUndoableAction } from '../../interfaces/action.interface';
import { updateProjectKeywordsIfPartialContainsTitle } from 'cd-common/utils';
import { updateProjectTimestamp } from '../../utils/project.utils';

export const PROJECT_DATA = '[Project Data]';

export const PROJECT_DATA_QUERY = `${PROJECT_DATA} query projects`;
export const PROJECT_DATA_QUERY_SUCCESS = `${PROJECT_DATA} query success`;
export const PROJECT_DATA_QUERY_FAILURE = `${PROJECT_DATA} query failure`;

export const PROJECT_DATA_UPDATE = `${PROJECT_DATA} update`;
export const PROJECT_DATA_UPDATE_SUCCESS = `${PROJECT_DATA} update success`;
export const PROJECT_DATA_UPDATE_FAILURE = `${PROJECT_DATA} update failed`;

export const PROJECT_DATA_DELETE_HOME_BOARD = `${PROJECT_DATA} delete home board`;
export const PROJECT_DATA_DELETE_HOME_BOARD_SUCCESS = `${PROJECT_DATA} delete home board success`;
export const PROJECT_DATA_DELETE_HOME_BOARD_FAILURE = `${PROJECT_DATA} delete home board failure`;

export const PROJECT_DATA_CURRENT_USER_IS_OWNER = `${PROJECT_DATA} current user is owner`;
export const PROJECT_DATA_ADD_ASSET_ID = `${PROJECT_DATA} add asset id`;

export class ProjectDataCurrentUserIsOwner implements Action {
  readonly type = PROJECT_DATA_CURRENT_USER_IS_OWNER;
  constructor(public isOwner: boolean) {}
}

export class ProjectDataQuery implements Action {
  readonly type = PROJECT_DATA_QUERY;
}

export class ProjectDataQuerySuccess implements Action {
  readonly type = PROJECT_DATA_QUERY_SUCCESS;
  constructor(public projectId: string, public projectData: IProject) {}
}

export class ProjectDataQueryFailure implements Action {
  readonly type = PROJECT_DATA_QUERY_FAILURE;
}

export class ProjectDataUpdate implements IUndoableAction {
  readonly type = PROJECT_DATA_UPDATE;
  constructor(
    public payload: Partial<IProject>,
    public undoable = true,
    public updateDatabase = true
  ) {
    // These updates must occur here to get captured by the offline effect and written to firestore
    const payloadWithKeywords = updateProjectKeywordsIfPartialContainsTitle(this.payload);
    this.payload = updateProjectTimestamp(payloadWithKeywords);
  }
}

export class ProjectDataUpdateSuccess implements Action {
  readonly type = PROJECT_DATA_UPDATE_SUCCESS;
}

export class ProjectDataUpdateFailure implements Action {
  readonly type = PROJECT_DATA_UPDATE_FAILURE;
}

// This has to be a separate action (from the generic ProjectDataUpdate)
// because deletion from database requires us to insert a sentinel value to the
// afs update() request, while the reducer needs to delete that field in store
// state.
export class ProjectDataDeleteHomeBoard implements Action {
  readonly type = PROJECT_DATA_DELETE_HOME_BOARD;
}

export class ProjectDataDeleteHomeBoardSuccess implements Action {
  readonly type = PROJECT_DATA_DELETE_HOME_BOARD_SUCCESS;
}

export class ProjectDataDeleteHomeBoardFailure implements Action {
  readonly type = PROJECT_DATA_DELETE_HOME_BOARD_FAILURE;
}

export type ProjectDataAction =
  | ProjectDataCurrentUserIsOwner
  | ProjectDataQuery
  | ProjectDataQuerySuccess
  | ProjectDataQueryFailure
  | ProjectDataUpdate
  | ProjectDataUpdateSuccess
  | ProjectDataUpdateFailure
  | ProjectDataDeleteHomeBoard
  | ProjectDataDeleteHomeBoardSuccess
  | ProjectDataDeleteHomeBoardFailure;
