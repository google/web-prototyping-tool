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

export const HISTORY = '[History]';

export const HISTORY_UNDO = `${HISTORY} Undo`;
export const HISTORY_REDO = `${HISTORY} Redo`;
export const HISTORY_RESET = `${HISTORY} Reset`;

export class HistoryUndo implements Action {
  readonly type = HISTORY_UNDO;
}

export class HistoryRedo implements Action {
  readonly type = HISTORY_REDO;
}

export class HistoryReset implements Action {
  readonly type = HISTORY_RESET;
}

export type HistoryAction = HistoryUndo | HistoryRedo | HistoryReset;
