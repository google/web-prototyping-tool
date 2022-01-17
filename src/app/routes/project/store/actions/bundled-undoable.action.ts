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
import { IUndoableAction } from '../../interfaces/action.interface';

export const BUNDLED_UNDOABLE = '[Bundled Undoable]';

export class BundledUndoableActions implements IUndoableAction {
  readonly undoable = true;
  readonly type = BUNDLED_UNDOABLE;
  readonly actions: Action[];

  constructor(...actions: Action[]) {
    this.checkRepeatedType(actions);
    this.actions = actions;
  }

  private checkRepeatedType(actions: Action[]) {
    const seenActions = new Set<string>();

    for (const { type } of actions) {
      if (seenActions.has(type)) {
        throw new Error(`Bundled Undoable Actions do not handle multiple actions
        of the same type right now, because effects have not been amended
        accordingly. Please consider modifying your actions to handle multiple
        payloads.`);
      }

      seenActions.add(type);
    }
  }
}
