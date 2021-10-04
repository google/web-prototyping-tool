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

import { IReducerFunctionLookup, EntityType } from 'cd-interfaces';
import {
  SelectionDeselectAll,
  SELECTION_DESELECT_ALL,
  SelectionAction,
  SELECTION_SET,
  SelectionSet,
} from '../actions';
import { APP_GO_TO_PREVIEW } from 'src/app/store/actions';

// To facilitate fast lookup, use sets and maps.
// For elementIds, we can't directly use sets because they internally
// compare object references for non-primitive-type items. As such, to both support
// fast lookup and preserving the ITemplateElementId structure to avoid unnecessary
// serialization, we use a map.
export interface ISelectionState {
  ids: Set<string>;
  outletFramesSelected: boolean;
  symbolInstancesSelected: boolean;
  codeComponentInstancesSelected: boolean;
  type: EntityType;
}

export const initialState: ISelectionState = {
  ids: new Set(),
  outletFramesSelected: false,
  symbolInstancesSelected: false,
  codeComponentInstancesSelected: false,
  type: EntityType.Project,
};

const handleSetSelection = (
  _state: ISelectionState,
  {
    ids,
    entityType,
    outletFramesSelected,
    symbolInstancesSelected,
    codeComponentInstancesSelected,
  }: SelectionSet
): ISelectionState => ({
  ids,
  outletFramesSelected,
  type: entityType,
  symbolInstancesSelected,
  codeComponentInstancesSelected,
});

const handleDeselectAll = (
  _state: ISelectionState,
  _action: SelectionDeselectAll
): ISelectionState => ({
  ...initialState,
});

const lookup: IReducerFunctionLookup = {
  [SELECTION_SET]: handleSetSelection,
  [SELECTION_DESELECT_ALL]: handleDeselectAll,
  [APP_GO_TO_PREVIEW]: handleDeselectAll,
};

export function reducer(state = initialState, action: SelectionAction) {
  return action.type in lookup ? lookup[action.type](state, action) : state;
}
