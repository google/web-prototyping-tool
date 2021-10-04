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
import { ConfigAction } from '../../interfaces/action.interface';
import { ICustomComponenSwapPayload } from '../../utils/symbol.utils';

export const SYMBOL = '[Symbol]';

export const SYMBOL_CREATE = `${SYMBOL} Create`;
export const SYMBOL_DELETE = `${SYMBOL} Delete`;
export const SYMBOL_RENAME = `${SYMBOL} Rename`;
export const SYMBOL_UNPACK_INSTANCE = `${SYMBOL} Unpack Instance`;
export const SYMBOL_UNPACK_INSTANCE_CONFIRM = `${SYMBOL} Unpack Instance Confirm`;
export const SYMBOL_SCREENSHOT_UPDATE = `${SYMBOL} screenshot update`;
export const SYMBOL_SWAP_VERSION = `${SYMBOL} Swap version`;

export class SymbolCreate extends ConfigAction {
  readonly type = SYMBOL_CREATE;
}

export class SymbolDelete implements Action {
  readonly type = SYMBOL_DELETE;

  constructor(public readonly payload: cd.ISymbolProperties, public removePublishEntry = true) {}
}

export class SymbolRename implements Action {
  readonly type = SYMBOL_RENAME;
  constructor(public readonly id: string, public name: string) {}
}

export class SymbolUnpackInstance extends ConfigAction {
  readonly type = SYMBOL_UNPACK_INSTANCE;
}

export class SymbolUnpackInstanceConfirm implements Action {
  readonly type = SYMBOL_UNPACK_INSTANCE_CONFIRM;
}

export class SymbolScreenshotUpdate implements Action {
  readonly type = SYMBOL_SCREENSHOT_UPDATE;
  constructor(public readonly symbolId: string, public readonly downloadUrl: string) {}
}

export class SymbolSwapVersion implements Action {
  readonly type = SYMBOL_SWAP_VERSION;
  constructor(public payload: ICustomComponenSwapPayload, public navigateToComponent = false) {}
}

export type SymbolAction =
  | SymbolCreate
  | SymbolDelete
  | SymbolUnpackInstance
  | SymbolSwapVersion
  | SymbolUnpackInstanceConfirm
  | SymbolScreenshotUpdate;
