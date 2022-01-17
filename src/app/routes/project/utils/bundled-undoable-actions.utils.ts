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
import { BUNDLED_UNDOABLE, BundledUndoableActions } from '../store/actions/bundled-undoable.action';

export const isBundledUndoableAction = (action: Action): action is BundledUndoableActions =>
  action.type === BUNDLED_UNDOABLE;

const getBundledAction = (bundle: BundledUndoableActions, type: string): Action | undefined =>
  bundle.actions.find(({ type: bundledActionType }) => bundledActionType === type);

export const getActionOfType = (actionOrBundle: Action, type: string): Action | undefined => {
  if (actionOrBundle.type === type) return actionOrBundle;
  if (actionOrBundle.type === BUNDLED_UNDOABLE)
    return getBundledAction(actionOrBundle as BundledUndoableActions, type);
  return;
};
