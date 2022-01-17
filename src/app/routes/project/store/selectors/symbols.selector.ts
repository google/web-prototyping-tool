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

import { getLastUpdatedIds, getElementProperties } from './element-properties.selector';
import { createSelector } from '@ngrx/store';
import { ElementPropertiesMap, ISymbolProperties, ISymbolMap } from 'cd-interfaces';
import { isSymbolDefinition } from 'cd-common/models';
import { getSymbolsIds } from './project-data.selector';
import { areArraysEqual } from 'cd-utils/array';
import { getAllBoardIds } from './board.selector';

/**
 * This selector extracts an array of ISymbolProperties from the the ElementPropertiesMap.
 * It performs various checks to ensure that it only triggers changes to downstream
 * subscriptions if symbols have been added, removed, or updated.
 *
 * Duplicate behavior to getAllBoards in symbol.selector.ts
 */
let previousSymbolIds: string[] = [];
let previousSymbols: ISymbolProperties[] = [];
let symbolsMissing = false;

export const getAllSymbolIds = createSelector(getSymbolsIds, (symbolIds: string[]) => symbolIds);

export const getAllRootIds = createSelector(
  getAllBoardIds,
  getSymbolsIds,
  (boardIds: string[], symbolIds: string[]) => [...boardIds, ...symbolIds]
);

export const getAllSymbols = createSelector(
  getSymbolsIds,
  getLastUpdatedIds,
  getElementProperties,
  (symbolIds: string[], lastUpdatedIds: Set<string>, elementProperties: ElementPropertiesMap) => {
    // don't construct new array unless one of the following conditions:
    // 1. list of symbol ids in project have changed (i.e. a symbol added or removed)
    // 2. lastUpdatedIds contains a symbol id (i.e. a symbol has been updated)
    // 3. Previous attempts to getAllSymbols had symbol models missing

    // TODO : ensure that symbolIds is not every undefined
    const symbolUpdated = (symbolIds || []).some((id) => lastUpdatedIds.has(id));
    if (areArraysEqual(symbolIds, previousSymbolIds) && !symbolUpdated && !symbolsMissing) {
      return previousSymbols;
    }

    // preserve last used copy of symbol ids for future checks
    previousSymbolIds = symbolIds;

    // use a reducer instead of map for easier null check;
    // it is possible to have symbol ids set on project before
    // their models have been set in the ElementPropertiesMap
    previousSymbols = symbolIds.reduce<ISymbolProperties[]>((acc, id: string) => {
      const props = elementProperties[id];
      if (props && isSymbolDefinition(props)) {
        acc.push(props as ISymbolProperties);
      }
      return acc;
    }, []);

    // If symbol properties have not been loaded yet,
    // the computed array of symbol will be missing symbols
    // record whether any symbols are missing, so when future updates
    // trigger, we will recompute symbols
    symbolsMissing = previousSymbols.length !== symbolIds.length;
    return previousSymbols;
  }
);

export const getSymbolMap = createSelector(getAllSymbols, (symbols: ISymbolProperties[]) => {
  return symbols.reduce<ISymbolMap>((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});
});
