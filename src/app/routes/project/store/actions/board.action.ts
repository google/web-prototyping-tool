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

import { ConfigAction } from '../../interfaces/action.interface';
import { Action } from '@ngrx/store';
import * as cd from 'cd-interfaces';

const BOARD = '[Board]';

export const BOARD_CREATE = `${BOARD} create`;
export const BOARD_CREATE_VIA_MARQUEE = `${BOARD} create via marquee`;
export const BOARD_MOVE = `${BOARD} move`;
export const BOARD_PREVIEW = `${BOARD} preview`;
export const BOARD_SET_HOME = `${BOARD} set home`;
export const BOARD_FIT_CONTENT = `${BOARD} fit content`;

export class BoardCreate implements Action {
  readonly type = BOARD_CREATE;
  constructor(
    public boardParameters?: Partial<cd.IBoardProperties>[],
    public content?: cd.IComponentInstanceGroup[],
    public isResultingElemActionUndoable: boolean = true,
    public symbolModels?: cd.PropertyModel[],
    public selectOnCreate = true,
    public keepOriginalId = false
  ) {}
}

export class BoardCreateViaMarquee implements Action {
  readonly type = BOARD_CREATE_VIA_MARQUEE;
  constructor(public rect: cd.IRect) {}
}

export class BoardMove extends ConfigAction {
  readonly type = BOARD_MOVE;
}

export class BoardPreview extends ConfigAction {
  readonly type = BOARD_PREVIEW;
}

export class BoardSetHome extends ConfigAction {
  readonly type = BOARD_SET_HOME;
}

export class BoardFitContent implements Action {
  readonly type = BOARD_FIT_CONTENT;
  constructor(public ids: string[]) {}
}

export type BoardAction =
  | BoardMove
  | BoardPreview
  | BoardSetHome
  | BoardFitContent
  | BoardCreate
  | BoardCreateViaMarquee;
