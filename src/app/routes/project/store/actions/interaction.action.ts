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
import * as cd from 'cd-interfaces';

const INTERACTION = '[Interactions]';

export const INTERACTION_COPY_ACTION = `${INTERACTION} Copy Action(s)`;
export const INTERACTION_PASTE_ACTION = `${INTERACTION} Paste Action(s)`;
export const INTERACTION_CLEAR_CLIPBOARD = `${INTERACTION} Clear Clipboard`;

export class InteractionClearClipboard implements Action {
  readonly type = INTERACTION_CLEAR_CLIPBOARD;
}

export class InteractionCopyActions implements Action {
  readonly type = INTERACTION_COPY_ACTION;
  constructor(public elementId: string, public actions: cd.ActionBehavior[]) {}
}

export class InteractionPasteActions implements Action {
  readonly type = INTERACTION_PASTE_ACTION;
  constructor(public elementId: string) {}
}

export type InteractionAction = InteractionCopyActions | InteractionPasteActions;
