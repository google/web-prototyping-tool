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
import type { ICodeComponentDocument } from 'cd-interfaces';
import { IUndoableAction, ConfigAction } from '../../interfaces/action.interface';
import { ICustomComponenSwapPayload } from '../../utils/symbol.utils';

const CODE_COMPONENT = '[Code component]';

export const CODE_COMPONENT_CREATE = `${CODE_COMPONENT} create`;
export const CODE_COMPONENT_UPDATE = `${CODE_COMPONENT} update`;
export const CODE_COMPONENT_DELETE = `${CODE_COMPONENT} delete`;

export const CODE_COMPONENT_REMOTE_ADD = `${CODE_COMPONENT} remote add`;

export const CODE_COMPONENT_OPEN_EDITOR = `${CODE_COMPONENT} open editor`;

export const CODE_COMPONENT_SWAP_VERSION = `${CODE_COMPONENT} Swap version`;

// Create is not undoable to prevent user from accidentally
// removing code component when undoing actions on code component page
export class CodeComponentCreate implements Action {
  readonly type = CODE_COMPONENT_CREATE;
  constructor(public codeComponents: ICodeComponentDocument[]) {}
}

export class CodeComponentUpdate implements IUndoableAction {
  readonly type = CODE_COMPONENT_UPDATE;
  constructor(
    public id: string,
    public update: Partial<ICodeComponentDocument>,
    public undoable = true
  ) {}
}

export class CodeComponentDelete implements Action {
  readonly type = CODE_COMPONENT_DELETE;
  constructor(public codeComponent: ICodeComponentDocument, public removePublishEntry = true) {}
}

/**
 * This action is dispatched when code components for a project are loaded from the database
 */
export class CodeComponentRemoteAdd implements Action {
  readonly type = CODE_COMPONENT_REMOTE_ADD;
  constructor(public codeComponents: ICodeComponentDocument[]) {}
}

export class CodeComponentOpenEditor extends ConfigAction {
  readonly type = CODE_COMPONENT_OPEN_EDITOR;
}

export class CodeComponentSwapVersion implements Action {
  readonly type = CODE_COMPONENT_SWAP_VERSION;
  constructor(public payload: ICustomComponenSwapPayload, public navigateToComponent = false) {}
}

export type CodeComponentAction =
  | CodeComponentCreate
  | CodeComponentUpdate
  | CodeComponentDelete
  | CodeComponentSwapVersion
  | CodeComponentOpenEditor;
