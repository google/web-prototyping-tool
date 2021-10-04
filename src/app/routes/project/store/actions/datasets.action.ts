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
import type { ProjectDataset } from 'cd-interfaces';

const DATASET = '[Dataset]';

export const DATASET_CREATE = `${DATASET} create`;
export const DATASET_UPDATE = `${DATASET} update`;
export const DATASET_DELETE = `${DATASET} delete`;

export const DATASET_REMOTE_ADD = `${DATASET} remote add`;

export const OPEN_ADD_DATASET_MENU = `${DATASET} open add dataset menu`;

export class DatasetCreate implements Action {
  readonly type = DATASET_CREATE;
  constructor(public datasets: ProjectDataset[]) {}
}

export class DatasetUpdate implements Action {
  readonly type = DATASET_UPDATE;
  constructor(public id: string, public changes: Partial<ProjectDataset>) {}
}

export class DatasetDelete implements Action {
  readonly type = DATASET_DELETE;
  constructor(public dataset: ProjectDataset) {}
}

export class OpenAddDatasetMenu implements Action {
  readonly type = OPEN_ADD_DATASET_MENU;
}

/**
 * This action is dispatched when datasets for a project are loaded from the database
 */
export class DatasetRemoteAdd implements Action {
  readonly type = DATASET_REMOTE_ADD;
  constructor(public datasets: ProjectDataset[]) {}
}

export type DatasetAction = DatasetCreate | DatasetUpdate | DatasetDelete | DatasetRemoteAdd;
