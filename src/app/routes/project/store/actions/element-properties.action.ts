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

import { remoteActionTag } from 'src/app/database/path.utils';
import { IUndoableAction, ConfigAction } from '../../interfaces/action.interface';
import { Action } from '@ngrx/store';
import * as cd from 'cd-interfaces';

export const ELEMENT_PROPS = '[Element Properties]';

export const ELEMENT_PROPS_REMOTE = `${ELEMENT_PROPS} ${remoteActionTag}`;
export const ELEMENT_PROPS_REMOTE_ADDED = `${ELEMENT_PROPS_REMOTE} ${cd.FirestoreChangeType.Added}`;
export const ELEMENT_PROPS_REMOTE_MODIFIED = `${ELEMENT_PROPS_REMOTE} ${cd.FirestoreChangeType.Modified}`;
export const ELEMENT_PROPS_REMOTE_REMOVED = `${ELEMENT_PROPS_REMOTE} ${cd.FirestoreChangeType.Removed}`;
export const ELEMENT_PROPS_MOVE = `${ELEMENT_PROPS} move`;
export const ELEMENT_PROPS_ORDER_CHANGE = `${ELEMENT_PROPS} order change`;
export const ELEMENT_PROPS_SELECT_PARENT = `${ELEMENT_PROPS} select parent`;
export const ELEMENT_PROPS_CREATE = `${ELEMENT_PROPS} create`;
export const ELEMENT_PROPS_UPDATE = `${ELEMENT_PROPS} update`;
export const ELEMENT_PROPS_DELETE = `${ELEMENT_PROPS} delete`;
export const ELEMENT_PROPS_REPLACE = `${ELEMENT_PROPS} replace`;
export const ELEMENT_PROPS_REPLACE_ALL = `${ELEMENT_PROPS} replace all`;
export const ELEMENT_PROPS_DELETE_ELEMENTS_AND_CHILDERN = `${ELEMENT_PROPS} delete elements and children`;
export const ELEMENT_PROPS_DUPLICATE = `${ELEMENT_PROPS} duplicate`;
export const ELEMENT_PROPS_TOGGLE_VISIBILITY = `${ELEMENT_PROPS} toggle visibility`;
export const ELEMENT_PROPS_UPDATE_FAILURE = `${ELEMENT_PROPS} failure`;
export const ELEMENT_PROPS_GROUP_ELEMENTS = `${ELEMENT_PROPS} group elements`;
export const ELEMENT_PROPS_UNGROUP_ELEMENTS = `${ELEMENT_PROPS} ungroup elements`;
export const ELEMENT_PROPS_CREATE_PORTAL_FROM_ELEMENTS = `${ELEMENT_PROPS} create portal from elements`;
export const ELEMENT_PROPS_ADD_INTERACTION = `${ELEMENT_PROPS} add action`;
export const ELEMENT_PROPS_SET_ALL = `${ELEMENT_PROPS} set all`;

export const ELEMENT_PROPS_CHANGE_REQUEST = `${ELEMENT_PROPS} change request`;

export class ElementPropertiesChangeRequest implements Action {
  readonly type = ELEMENT_PROPS_CHANGE_REQUEST;
  constructor(public payload: cd.IElementChangePayload[], public undoable = true) {}
}
export class ElementPropertiesReplaceAll implements Action {
  readonly type = ELEMENT_PROPS_REPLACE_ALL;
  constructor(public elementProperties: cd.ElementPropertiesMap) {}
}

// Actions that originate from database
export class ElementPropertiesRemoteAdd implements Action {
  readonly type = ELEMENT_PROPS_REMOTE_ADDED;
  constructor(public payload: cd.PropertyModel[]) {}
}

export class ElementPropertiesRemoteModified implements Action {
  readonly type = ELEMENT_PROPS_REMOTE_MODIFIED;
  constructor(public payload: cd.PropertyModel) {}
}

export class ElementPropertiesRemoteRemoved implements Action {
  readonly type = ELEMENT_PROPS_REMOTE_REMOVED;
  constructor(public payload: cd.PropertyModel) {}
}

// Actions that originate from local
export class ElementPropertiesOrderChange extends ConfigAction {
  readonly type = ELEMENT_PROPS_ORDER_CHANGE;
}

export class ElementPropertiesMove extends ConfigAction {
  readonly type = ELEMENT_PROPS_MOVE;
}

export class ElementPropertiesSelectParent extends ConfigAction {
  readonly type = ELEMENT_PROPS_SELECT_PARENT;
}

export class ElementPropertiesCreate implements IUndoableAction {
  readonly type = ELEMENT_PROPS_CREATE;
  constructor(
    public payload: cd.PropertyModel[],
    public undoable = true,
    public updates?: cd.IPropertiesUpdatePayload[],
    public deletions?: cd.PropertyModel[]
  ) {}
}

export class ElementPropertiesUpdate implements IUndoableAction {
  readonly type = ELEMENT_PROPS_UPDATE;
  constructor(public payload: cd.IPropertiesUpdatePayload[], public undoable = true) {}
}

export class ElementPropertiesUpdateFailure implements Action {
  readonly type = ELEMENT_PROPS_UPDATE_FAILURE;
}

export class ElementPropertiesDelete implements IUndoableAction {
  readonly type = ELEMENT_PROPS_DELETE;
  constructor(
    public payload: cd.PropertyModel[],
    public undoable = true,
    public updates?: cd.IPropertiesUpdatePayload[],
    public ignoreDeselect = false
  ) {}
}

export class ElementPropertiesReplace implements IUndoableAction {
  readonly type = ELEMENT_PROPS_REPLACE;
  constructor(
    public deleteId: string,
    public replaceElement: cd.PropertyModel,
    public undoable = true,
    public mergeStyleOverrides = true
  ) {}
}

export class ElementPropertiesDeleteElementsAndChildren extends ConfigAction {
  readonly type = ELEMENT_PROPS_DELETE_ELEMENTS_AND_CHILDERN;
}

export class ElementPropertiesDuplicate extends ConfigAction {
  readonly type = ELEMENT_PROPS_DUPLICATE;
}

export class ElementPropertiesToggleVisibility extends ConfigAction {
  readonly type = ELEMENT_PROPS_TOGGLE_VISIBILITY;
}

export class ElementPropertiesGroupElements extends ConfigAction {
  readonly type = ELEMENT_PROPS_GROUP_ELEMENTS;
}

export class ElementPropertiesUngroupElements extends ConfigAction {
  readonly type = ELEMENT_PROPS_UNGROUP_ELEMENTS;
}

export class ElementPropertiesCreatePortalFromElements extends ConfigAction {
  readonly type = ELEMENT_PROPS_CREATE_PORTAL_FROM_ELEMENTS;
}

export class ElementPropertiesAddInteraction extends ConfigAction {
  readonly type = ELEMENT_PROPS_ADD_INTERACTION;
}
// used by health check fixes
export class ElementPropertiesSetAll implements Action {
  readonly type = ELEMENT_PROPS_SET_ALL;
  constructor(
    public elementProperties: cd.ElementPropertiesMap,
    public deletedIds: Set<string>,
    public updateDb = true
  ) {}
}

export type ElementPropertiesAction =
  | ElementPropertiesAddInteraction
  | ElementPropertiesCreate
  | ElementPropertiesDelete
  | ElementPropertiesDeleteElementsAndChildren
  | ElementPropertiesDuplicate
  | ElementPropertiesGroupElements
  | ElementPropertiesOrderChange
  | ElementPropertiesMove
  | ElementPropertiesCreatePortalFromElements
  | ElementPropertiesRemoteAdd
  | ElementPropertiesRemoteModified
  | ElementPropertiesRemoteRemoved
  | ElementPropertiesReplaceAll
  | ElementPropertiesSelectParent
  | ElementPropertiesSetAll
  | ElementPropertiesUngroupElements
  | ElementPropertiesUpdate
  | ElementPropertiesUpdateFailure
  | ElementPropertiesChangeRequest;
