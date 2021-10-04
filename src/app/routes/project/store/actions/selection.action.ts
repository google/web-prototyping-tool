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
import { EntityType } from 'cd-interfaces';

export const SELECTION = '[Selection]';
export const SELECTION_SET = `${SELECTION} set`;
export const SELECTION_TOGGLE_ELEMENTS = `${SELECTION} toggle element`;
export const SELECTION_DESELECT_ALL = `${SELECTION} deselect all`;

export class SelectionSet implements Action {
  readonly type = SELECTION_SET;
  constructor(
    public ids: Set<string>,
    public outletFramesSelected: boolean,
    public entityType: EntityType = EntityType.Element,
    public symbolInstancesSelected = false,
    public codeComponentInstancesSelected = false
  ) {}
}

export class SelectionToggleElements implements Action {
  readonly type = SELECTION_TOGGLE_ELEMENTS;
  constructor(
    public ids: string[],
    public appendToSelection = false,
    public allowToggleDeselect = false
  ) {}
}

export class SelectionDeselectAll implements Action {
  readonly type = SELECTION_DESELECT_ALL;
}

export type SelectionAction = SelectionSet | SelectionToggleElements | SelectionDeselectAll;
