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
import { IProjectState, getProjectState } from '../reducers';
import { IPanelsState } from '../../interfaces/panel.interface';
import { getAllBoards } from './board.selector';
import { getAllSymbols } from './symbols.selector';
import { IBoardProperties, ISymbolProperties, RootElement } from 'cd-interfaces';
import { initialPanel } from '../../configs/panel.config';

export const getPanelsState = createSelector(
  getProjectState,
  (state?: IProjectState) => state?.panels ?? initialPanel
);

export const getPropertiesPanelState = createSelector(
  getPanelsState,
  (state: IPanelsState) => state.propertiesPanelState
);

export const getLeftPanel = createSelector(
  getPanelsState,
  (state: IPanelsState) => state.leftPanel
);

export const getRightPanel = createSelector(
  getPanelsState,
  (state: IPanelsState) => state.rightPanel
);

export const getBottomPanel = createSelector(
  getPanelsState,
  (state: IPanelsState) => state.bottomPanel
);

export const getCurrentActivity = createSelector(
  getPanelsState,
  (state: IPanelsState) => state.currentActivity
);

export const getPropertyMode = createSelector(
  getPanelsState,
  (state: IPanelsState) => state.propertyMode
);

export const getSymbolMode = createSelector(
  getPanelsState,
  (state: IPanelsState) => state.symbolMode
);

export const getIsolatedSymbolId = createSelector(
  getPanelsState,
  (state: IPanelsState) => state.isolatedSymbolId
);

export const getIsRecordingStateChanges = createSelector(
  getPanelsState,
  (state: IPanelsState) => state.recordStateChanges
);

export const getCurrentOutletFrames = createSelector(
  getAllBoards,
  getAllSymbols,
  getSymbolMode,
  getIsolatedSymbolId,
  (
    boards: IBoardProperties[],
    symbols: ISymbolProperties[],
    symbolMode: boolean,
    isolatedSymbolId?: string
  ): RootElement[] => {
    if (!symbolMode) return boards;
    if (!isolatedSymbolId) return symbols;
    const isolatedSymbol = symbols.find((s) => s.id === isolatedSymbolId);
    return isolatedSymbol ? [isolatedSymbol] : [];
  }
);

export const getCurrentOutletFrameIds = createSelector(
  getCurrentOutletFrames,
  (rootElements: RootElement[]): string[] => {
    return rootElements.map((r) => r.id);
  }
);
