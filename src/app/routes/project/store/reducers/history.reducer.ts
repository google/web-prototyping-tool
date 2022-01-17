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

import { ActionReducer, Action } from '@ngrx/store';
import * as HistoryActions from '../actions/history.action';
import { IHistoryState, IHistoryItem } from '../../interfaces/history.interface';
import { resetDerivedFields as resetPropertiesDerivedFields } from '../reducers/element-properties.reducer';
import * as utils from '../../utils/history.utils';
import { isBundledUndoableAction } from '../../utils/bundled-undoable-actions.utils';
import { initialHistoryState } from '../../configs/history.config';
import { IProjectState } from './index';
import { ElementPropertiesAction } from '../actions/element-properties.action';
import { CODE_COMPONENT_UPDATE, CodeComponentUpdate } from '../actions/code-component.action';
import { registerCodeComponent } from 'cd-common/models';
import { deepCopy } from 'cd-utils/object';


export const handleUndo = (state: IProjectState): IProjectState => {
  const { history } = state;
  const { past, current, future } = history;

  const newPast = [...past];
  const previous = newPast.pop();

  if (!previous) return { ...state, history: utils.getHistoryNotChangedState(history) };
  if (!current)
    throw new Error('Undo: current is undefined; History stack may have been corrupted.');

  const { action: currentAction } = current;

  return {
    ...state,
    ...previous.state,
    history: {
      past: newPast,
      current: previous,
      future: [
        {
          state: utils.getUndoableStateSlices(state),
          action: currentAction,
        },
        ...future,
      ],
      undoneAction: currentAction,
    },
  };
};

export const handleRedo = (state: IProjectState): IProjectState => {
  const { history } = state;
  const { past, current, future } = history;

  const newFuture = [...future];
  const next = newFuture.shift();

  if (!next) return { ...state, history: utils.getHistoryNotChangedState(history) };
  if (!current)
    throw new Error('Redo: current is undefined; History stack may have been corrupted.');

  const { action: currentAction } = current;

  return {
    ...state,
    ...next.state,
    history: {
      past: [
        ...past,
        {
          state: utils.getUndoableStateSlices(state),
          action: currentAction,
        },
      ],
      current: next,
      future: newFuture,
      undoneAction: next.action,
    },
  };
};

export const handleReset = (state: IProjectState): IProjectState => {
  const history = deepCopy(initialHistoryState);
  return { ...state, history };
};

export const handleNonHistoryAction = (
  state: IProjectState,
  reducer: ActionReducer<IProjectState, Action>,
  action: Action
): IProjectState => {
  const { history } = state;
  const { past, current, future } = history;

  if (utils.isUndoableAction(action)) {
    let newState: IProjectState;

    if (isBundledUndoableAction(action)) {
      newState = state;
      for (const bundledAction of action.actions) {
        newState = reducer(newState, bundledAction);
      }
    } else {
      newState = reducer(state, action);
    }

    return {
      ...newState,
      history: {
        past: [...past, current as IHistoryItem],
        current: {
          state: utils.getUndoableStateSlices(newState),
          action,
        },
        future: [],
        undoneAction: null,
      },
    };
  }

  const updated = reducer(state, action);

  return {
    ...updated,
    history: {
      past,
      future,
      undoneAction: null,
      current: utils.mergeCurrentState(current, updated),
    },
  };
};

// Special treatment for properties for undoing:
// When you undo/redo, lastUpdatedIds should indicate what have been undone/redone.
// This has to happen in meta reducer for iframe-wrapper to detect "if prop
// changes are for my board" in the same tick.
//
// Same situation for updateDisabled (needs to set it to false),
// but that really should be fixed with.
// (See handleBoardSetRenderResults at properties reducer.) <- TODO 
export const resetStateDerivedFields = (
  state: IProjectState,
  undoneAction: Action | null
): IProjectState => {
  if (!undoneAction) return state;

  let propertiesState = state.elementProperties;

  if (isBundledUndoableAction(undoneAction)) {
    for (const bundledAction of undoneAction.actions) {
      propertiesState = resetPropertiesDerivedFields(
        propertiesState,
        bundledAction as ElementPropertiesAction
      );
    }
  } else {
    propertiesState = resetPropertiesDerivedFields(
      propertiesState,
      undoneAction as ElementPropertiesAction
    );
  }

  const update = { ...state, elementProperties: propertiesState };

  // Ensure that any undone code component updates are set in registry
  if (undoneAction.type === CODE_COMPONENT_UPDATE) {
    const { id } = undoneAction as CodeComponentUpdate;
    const component = update.codeComponents.entities[id];
    if (component) registerCodeComponent(component);
  }
  return update;
};

// We need a named function expression (instead of an arrow function assigned to a const)
// for angular AOT to be happy
export function metaReducer(
  reducer: ActionReducer<IProjectState, Action>
): ActionReducer<IProjectState, Action> {
  // console.log('meta reducer called');

  return (state: IProjectState | undefined, action: Action): IProjectState => {
    // console.log('meta reducer project state', state, action);

    // The very initialization
    if (!state) return reducer(state, action);

    // console.log('Current history state', state.history);
    // console.log('Current history state, copied', JSON.parse(JSON.stringify(state.history)));

    // TODO : Get rid of this when we finish debugging (can simply switch-case-return too)
    let ret: IProjectState;

    switch (action.type) {
      case HistoryActions.HISTORY_UNDO: {
        ret = handleUndo(state);
        ret = resetStateDerivedFields(ret, ret.history.undoneAction);
        break;
      }

      case HistoryActions.HISTORY_REDO: {
        ret = handleRedo(state);
        ret = resetStateDerivedFields(ret, ret.history.undoneAction);
        break;
      }

      case HistoryActions.HISTORY_RESET: {
        ret = handleReset(state);
        break;
      }

      default: {
        ret = handleNonHistoryAction(state, reducer, action);
      }
    }

    // console.log('Next history state', ret.history);
    // console.log('Next history state, copied', JSON.parse(JSON.stringify(ret.history)));

    return ret;
  };
}

// This default reducer for the history ngrx store slice is more about making ngrx store happy;
// it's always a no-op because History actions are always handled by the meta reducer above.
// Also again, we need a named function expression (instead of an arrow function assigned to a const)
// for angular AOT to be happy
export function noOpReducer(state: IHistoryState = initialHistoryState) {
  return state;
}
