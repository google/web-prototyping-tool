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
import { IDesignSystem, IDesignSystemDocument, FirestoreChangeType } from 'cd-interfaces';
import { remoteActionTag } from 'src/app/database/path.utils';
import { IUndoableAction } from '../../interfaces/action.interface';

export const DESIGN_SYSTEM = '[DesignSystem]';
export const DESIGN_SYSTEM_UPDATE = `${DESIGN_SYSTEM} update`;
export const DESIGN_SYSTEM_REPLACE = `${DESIGN_SYSTEM} replace`;

export const DESIGN_SYSTEM_REMOTE = `${DESIGN_SYSTEM} ${remoteActionTag}`;
export const DESIGN_SYSTEM_REMOTE_ADDED = `${DESIGN_SYSTEM_REMOTE} ${FirestoreChangeType.Added}`;
export const DESIGN_SYSTEM_REMOTE_MODIFIED = `${DESIGN_SYSTEM_REMOTE} ${FirestoreChangeType.Modified}`;

export const DESIGN_SYSTEM_DOCUMENT_CREATE = `${DESIGN_SYSTEM} document create`;
export const DESIGN_SYSTEM_DOCUMENT_SET = `${DESIGN_SYSTEM} set design system`;

export const DESIGN_SYSTEM_REMOVE_FONT = `${DESIGN_SYSTEM} remove font`;
export const DESIGN_SYSTEM_REMOVE_TYPOGRAPHY = `${DESIGN_SYSTEM} remove typography`;
export const DESIGN_SYSTEM_REMOVE_COLOR = `${DESIGN_SYSTEM} remove color`;

export const DESIGN_SYSTEM_REMOVE_VARIABLE = `${DESIGN_SYSTEM} remove variable`;
export const DESIGN_SYSTEM_REMOVE_GLOBAL_CSS = `${DESIGN_SYSTEM} remove global css`;
// From database
export class DesignSystemRemoteAdded implements Action {
  readonly type = DESIGN_SYSTEM_REMOTE_ADDED;
  constructor(public payload: IDesignSystemDocument) {}
}

export class DesignSystemRemoteModified implements Action {
  readonly type = DESIGN_SYSTEM_REMOTE_MODIFIED;
  constructor(public payload: IDesignSystemDocument) {}
}

// local actions
export class DesignSystemDocumentCreate implements Action {
  readonly type = DESIGN_SYSTEM_DOCUMENT_CREATE;
  constructor(public payload: IDesignSystemDocument) {}
}

export class DesignSystemUpdate implements IUndoableAction {
  readonly type = DESIGN_SYSTEM_UPDATE;
  constructor(
    public id: string,
    public update: Partial<IDesignSystemDocument>,
    public replace = false,
    public undoable = true
  ) {}
}

export class DesignSystemReplace implements Action {
  readonly type = DESIGN_SYSTEM_REPLACE;
  constructor(public update: Partial<IDesignSystem>) {}
}

export class DesignSystemRemoveFont implements Action {
  readonly type = DESIGN_SYSTEM_REMOVE_FONT;
  constructor(public id: string) {}
}

export class DesignSystemRemoveTypography implements Action {
  readonly type = DESIGN_SYSTEM_REMOVE_TYPOGRAPHY;
  constructor(public id: string) {}
}

export class DesignSystemRemoveColor implements Action {
  readonly type = DESIGN_SYSTEM_REMOVE_COLOR;
  constructor(public id: string) {}
}

export class DesignSystemRemoveVariable implements Action {
  readonly type = DESIGN_SYSTEM_REMOVE_VARIABLE;
  constructor(public id: string) {}
}

export class DesignSystemRemoveGlobalCSS implements Action {
  readonly type = DESIGN_SYSTEM_REMOVE_GLOBAL_CSS;
  constructor() {}
}

export type DesignSystemAction =
  | DesignSystemDocumentCreate
  | DesignSystemRemoteAdded
  | DesignSystemRemoteModified
  | DesignSystemRemoveColor
  | DesignSystemRemoveFont
  | DesignSystemRemoveTypography
  | DesignSystemReplace
  | DesignSystemRemoveGlobalCSS
  | DesignSystemUpdate;
