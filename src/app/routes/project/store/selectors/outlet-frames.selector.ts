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

import { createSelector } from '@ngrx/store';
import { getAllSymbols } from './symbols.selector';
import { getAllBoards } from './board.selector';
import * as cd from 'cd-interfaces';

export interface IOutletFrameSubscription {
  boards: cd.IBoardProperties[];
  symbols: cd.ISymbolProperties[];
}
// Retrieve boards and symbols from a single selector
export const getAllOutletFrames = createSelector(
  getAllSymbols,
  getAllBoards,
  (symbols: cd.ISymbolProperties[], boards: cd.IBoardProperties[]) =>
    ({ symbols, boards } as IOutletFrameSubscription)
);
