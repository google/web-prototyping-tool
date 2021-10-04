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
import { remoteActionTag } from 'src/app/database/path.utils';
import { FirestoreChangeType, IProjectAsset } from 'cd-interfaces';

export const ASSETS = '[Assets]';

export const ASSETS_SELECT_FILES = `${ASSETS} Select Files`;

export const ASSETS_REMOTE = `${ASSETS} ${remoteActionTag}`;
export const ASSETS_REMOTE_ADDED = `${ASSETS_REMOTE} ${FirestoreChangeType.Added}`;
export const ASSETS_REMOTE_MODIFIED = `${ASSETS_REMOTE} ${FirestoreChangeType.Modified}`;

export const ASSETS_DELETED = `${ASSETS} deleted`;
export const ASSETS_REPLACE = `${ASSETS} replace`;
export const ASSETS_NAME_CHANGED = `${ASSETS} name changed`;

export const ASSETS_CREATE_DOCS = `${ASSETS} create asset documents`;

export class AssetsSelectFiles implements Action {
  readonly type = ASSETS_SELECT_FILES;
  constructor(public jsFile = false) {}
}

// From database -- add to assets panel
export class AssetsRemoteAdded implements Action {
  readonly type = ASSETS_REMOTE_ADDED;
  constructor(public payload: IProjectAsset[]) {}
}

// From database -- Mostly it's URL changed
export class AssetsRemoteModified implements Action {
  readonly type = ASSETS_REMOTE_MODIFIED;
  constructor(public payload: IProjectAsset) {}
}

export class AssetsDeleted implements Action {
  readonly type = ASSETS_DELETED;
  constructor(public id: string) {}
}

export class AssetReplace implements Action {
  readonly type = ASSETS_REPLACE;
  constructor(
    public oldId: string,
    public replacementId: string,
    public replacementValue: string
  ) {}
}

export class AssetsNameChanged implements Action {
  readonly type = ASSETS_NAME_CHANGED;
  constructor(public id: string, public name: string) {}
}

export class AssetsCreateDocuments implements Action {
  readonly type = ASSETS_CREATE_DOCS;
  constructor(public payload: IProjectAsset[]) {}
}

export type AssetsAction =
  | AssetsSelectFiles
  | AssetsRemoteAdded
  | AssetsRemoteModified
  | AssetsDeleted
  | AssetsNameChanged
  | AssetsCreateDocuments;
