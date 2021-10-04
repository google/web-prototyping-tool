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
import { IProject, IOfflineProjectState } from 'cd-interfaces';

export const PROJECT_CONTENT = '[Project Content]';
export const PROJECT_CONTENT_QUERY = `${PROJECT_CONTENT} query`;
export const PROJECT_CONTENT_LOAD_REMOTE_DATA = `${PROJECT_CONTENT} load remote data`;
export const PROJECT_CONTENT_LOAD_LOCAL_DATA = `${PROJECT_CONTENT} load local data`;

export const PROJECT_CONTENT_QUERY_SUCCESS = `${PROJECT_CONTENT} query success`;

export class ProjectContentLoadRemoteData implements Action {
  readonly type = PROJECT_CONTENT_LOAD_REMOTE_DATA;
  constructor(public remoteProject: IProject) {}
}

export class ProjectContentLoadLocalData implements Action {
  readonly type = PROJECT_CONTENT_LOAD_LOCAL_DATA;
  constructor(
    public remoteProject: IProject,
    public localData: IOfflineProjectState,
    public syncData: boolean
  ) {}
}

export class ProjectContentQuery implements Action {
  readonly type = PROJECT_CONTENT_QUERY;
}

export class ProjectContentQuerySuccess implements Action {
  readonly type = PROJECT_CONTENT_QUERY_SUCCESS;
}

export type ProjectContentAction =
  | ProjectContentQuery
  | ProjectContentQuerySuccess
  | ProjectContentLoadRemoteData
  | ProjectContentLoadLocalData;
