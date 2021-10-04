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
import { Action } from '@ngrx/store';

// global action that all reducers can respond to
export const DISCONNECT_PROJECT = `[Disconnect project]`;
export const SYNC_LOCAL_DATABASE = `[Sync local database]`;

export class DisconnectProject implements Action {
  readonly type = DISCONNECT_PROJECT;
}

export class SyncLocalDatabase implements Action {
  readonly type = SYNC_LOCAL_DATABASE;
  constructor(public remoteProject: cd.IProject, public localData: cd.IOfflineProjectState) {}
}

export * from './assets.action';
export * from './board.action';
export * from './canvas.action';
export * from './clipboard.action';
export * from './code-component.action';
export * from './comment-threads.action';
export * from './datasets.action';
export * from './design-system.action';
export * from './element-properties.action';
export * from './history.action';
export * from './images.action';
export * from './interaction.action';
export * from './offline.action';
export * from './panels.action';
export * from './project-content.action';
export * from './project-data.action';
export * from './publish.action';
export * from './selection.action';
export * from './symbols.action';
export * from './custom-component.action';
export * from './layout.action';
