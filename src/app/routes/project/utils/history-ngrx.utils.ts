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

import { Action, Store, select } from '@ngrx/store';
import { ofType } from '@ngrx/effects';
import { OperatorFunction } from 'rxjs';
import { withLatestFrom, map, switchMap, filter } from 'rxjs/operators';

import { UndoableStateSlices } from '../interfaces/history.interface';
import { IProjectState } from '../store/reducers';
import {
  getHistoryUndoneAction,
  getHistoryCurrentState,
} from '../store/selectors/history.selector';
import { HistoryAction, HISTORY_UNDO, HISTORY_REDO } from '../store/actions/history.action';
import { BUNDLED_UNDOABLE, BundledUndoableActions } from '../store/actions/bundled-undoable.action';
import { getActionOfType } from './bundled-undoable-actions.utils';

// Custom ngrx operators

/**
 * A helper operator that abstracts undo/redo result, used when ingesting undone/
 * redone information by the effects.
 *
 * @template `<A1>` — `Action` with `Action.type === allowedUndoneActionTypes[0]`
 * @template (optional) `<A2>` — `Action` with `Action.type === allowedUndoneActionTypes[1]`
 * @template (optional) `<A3>` — `Action` with `Action.type === allowedUndoneActionTypes[2]`
 * @param projectStore as injected into an ngrx effect
 * @param [...allowedUndoneActionTypes] Allowed undone/redone `Action.type`, as in the standard `ofType()`
 * @returns `[historyAction, destinationState, undoneOrRedoneActions]`
 *          where `historyAction` is either `HistoryUndo` or `HistoryRedo`,
 *                `destinationState` is the after-undo/redo state,
 *                `undoneOrRedoneActions` is `[A1, A2?, A3?]` as specified by the parameters.
 *
 * This function extracts `A1`, `A2`, and/or `A3` from `BundledUndoableActions`
 * if a bundle is undone/redone. Thus, it is possible that some (but not all) of
 * the actions are undefined, since a bundle may contain only some of A1, A2, and A3.
 *
 * @example
 *  actions$.pipe(
 *    ofUndoRedo<ElementPropsUpdate, ElementPropsDelete>(projectStore, ELEMENT_PROPS_UPDATE, ELEMENT_PROPS_DELETE),
 *    tap(([historyAction, destState, [elemPropsUpdate, elemPropsDelete]])) => {
 *      // `historyAction` is either `HistoryUndo` or `HistoryRedo`
 *      // `destState` is the after-undo/redo state,
 *      // `elemPropsUpdate` is `ElementPropsUpdate | undefined`,
 *      // `elemPropsDelete` is `ElementPropsDelete | undefined`,
 *    })
 *  )
 *
 * @summary
 * The generic typing of this operator is modeled after ngrx `ofType()`
 * ( https://github.com/ngrx/platform/blob/master/modules/effects/src/actions.ts#L57-L114 ),
 * where explicit typing on returned action array is offered for up to 3 distinct `allowedUndoneActionType`,
 * with a fallback to typing with > 3 `allowedUndoneActionType`. (All done in TS function overrides.)
 */
export function ofUndoRedo<A extends Action, U extends Action = Action>(
  projectStore: Store<IProjectState>,
  allowedUndoneActionType: string
): OperatorFunction<U, [HistoryAction, UndoableStateSlices, [A | undefined]]>;

// eslint-disable-next-line no-redeclare
export function ofUndoRedo<A1 extends Action, A2 extends Action, U extends Action = Action>(
  projectStore: Store<IProjectState>,
  ...allowedUndoneActionTypes: [string, string]
): OperatorFunction<U, [HistoryAction, UndoableStateSlices, [A1 | undefined, A2 | undefined]]>;

// eslint-disable-next-line no-redeclare
export function ofUndoRedo<
  A1 extends Action,
  A2 extends Action,
  A3 extends Action,
  U extends Action = Action
>(
  projectStore: Store<IProjectState>,
  ...allowedUndoneActionTypes: [string, string, string]
): OperatorFunction<
  U,
  [HistoryAction, UndoableStateSlices, [A1 | undefined, A2 | undefined, A3 | undefined]]
>;

// eslint-disable-next-line no-redeclare
export function ofUndoRedo<V extends Action>(
  projectStore: Store<IProjectState>,
  ...allowedUndoneActionTypes: string[]
): OperatorFunction<Action, [HistoryAction, UndoableStateSlices, (V | undefined)[]]>;
/**
 * Fallback of > 3 Action types, please see jsdoc above for detail.
 */
// eslint-disable-next-line no-redeclare
export function ofUndoRedo(
  projectStore: Store<IProjectState>,
  ...allowedUndoneActionTypes: string[]
): OperatorFunction<Action, [HistoryAction, UndoableStateSlices, (Action | undefined)[]]> {
  return (stream$) =>
    stream$.pipe(
      ofType<HistoryAction>(HISTORY_UNDO, HISTORY_REDO),
      withLatestFrom(projectStore.pipe(select(getHistoryCurrentState))),
      filter(([, state]) => !!state),
      withLatestFrom(projectStore.pipe(select(getHistoryUndoneAction))),
      map(([[historyAction, state], undoneActionOrBundle]) => {
        state = state as UndoableStateSlices;

        if (!undoneActionOrBundle) {
          return [historyAction, state, []];
        }

        const undoneActions = allowedUndoneActionTypes.map(
          (type) => getActionOfType(undoneActionOrBundle, type) as Action | undefined
        );

        return [historyAction, state, undoneActions];
      })
    );
}

/**
 * Returns actions of specified types. This behaves like the standard `ofType()`
 * for unbundled actions, but additionally extracts the specified actions from
 * `BundledUndoableActions`.
 *
 * @template `<V>` — `Action`s that have `Action.type` in `allowedTypes`
 * @param allowedTypes allowed `Action` types, as used in the standard `ofType()` operator
 * @returns `Action` with type specified in `allowedTypes`
 *
 * @example
 *  actions$.pipe(
 *    ofTypeIncludingBundled<ElementPropsUpdate | ElementPropsDelete>(ELEMENT_PROPS_UPDATE, ELEMENT_PROPS_DELETE),
 *    tap(action => {
 *      // `action` is an `ElementPropsUpdate` or `ElementPropsDelete`,
 *      // including unbundled ones, or ones inside a bundle.
 *    })
 *  )
 */
export const ofTypeIncludingBundled = <V extends Action>(
  ...allowedTypes: string[]
): OperatorFunction<Action, V> => {
  return (stream$) =>
    stream$.pipe(
      ofType<BundledUndoableActions | V>(BUNDLED_UNDOABLE, ...allowedTypes),
      switchMap(
        (actionOrBundle) =>
          allowedTypes
            .map((allowedType) => getActionOfType(actionOrBundle, allowedType))
            .filter((action) => !!action) as V[]
      )
    );
};
