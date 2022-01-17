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

import * as actions from '../actions/design-system.action';
import { IReducerFunctionLookup, IDesignSystemDocument } from 'cd-interfaces';
import { deepCopy } from 'cd-utils/object';

export interface IDesignSystemState {
  loaded: boolean;
  designSystem?: IDesignSystemDocument;
}

export const initialState: IDesignSystemState = {
  loaded: false,
};

const handleDesignSystemUpdate = (
  state: IDesignSystemState,
  action: actions.DesignSystemUpdate
): IDesignSystemState => {
  let { designSystem } = state;
  if (!designSystem) return state;

  const { update, replace } = action;
  const themeId = replace ? update.themeId : '';
  designSystem = deepCopy({ ...designSystem, ...update, themeId });

  return { ...state, designSystem };
};

const handleDesignSystemDocumentSet = (
  state: IDesignSystemState,
  action:
    | actions.DesignSystemRemoteAdded
    | actions.DesignSystemRemoteModified
    | actions.DesignSystemDocumentCreate
): IDesignSystemState => {
  const { payload: designSystem } = action;
  const loaded = designSystem !== undefined;
  return { ...state, loaded, designSystem };
};

const lookup: IReducerFunctionLookup = {
  [actions.DESIGN_SYSTEM_REMOTE_ADDED]: handleDesignSystemDocumentSet,
  [actions.DESIGN_SYSTEM_DOCUMENT_CREATE]: handleDesignSystemDocumentSet,
  [actions.DESIGN_SYSTEM_REMOTE_MODIFIED]: handleDesignSystemDocumentSet,
  [actions.DESIGN_SYSTEM_UPDATE]: handleDesignSystemUpdate,
};

export function reducer(
  state: IDesignSystemState = initialState,
  action: actions.DesignSystemAction
) {
  return action.type in lookup ? lookup[action.type](state, action) : state;
}
