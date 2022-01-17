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
import { ElementPropertiesMap, IBoardProperties } from 'cd-interfaces';
import { isBoard } from 'cd-common/models';
import { getBoardsIds } from './project-data.selector';
import { areArraysEqual } from 'cd-utils/array';
/**
 * This selector extracts an array of IBoardProperties from the the ElementPropertiesMap.
 * It performs various checks to ensure that it only triggers changes to downstream
 * subscriptions if boards have been added, removed, or updated.
 */
let previousBoardIds: string[] = [];
let previousBoards: IBoardProperties[] = [];
let boardsMissing = false;

export const getAllBoardIds = createSelector(getBoardsIds, (boardIds: string[]) => boardIds);

export const getAllBoards = createSelector(
  getBoardsIds,
  getLastUpdatedIds,
  getElementProperties,
  (boardIds: string[], lastUpdatedIds: Set<string>, elementProperties: ElementPropertiesMap) => {
    // don't construct new array unless one of the following conditions:
    // 1. list of board ids in project have changed (i.e. a board added or removed)
    // 2. lastUpdatedIds contains a board id (i.e. a board has been updated)
    // 3. Previous attempts to getAllBoards had board models missing

    // TODO : ensure that boardIds is not every undefined
    const boardUpdated = (boardIds || []).some((id) => lastUpdatedIds.has(id));
    if (areArraysEqual(boardIds, previousBoardIds) && !boardUpdated && !boardsMissing) {
      return previousBoards;
    }

    // preserve last used copy of board ids for future checks
    previousBoardIds = boardIds;

    // use a reducer instead of map for easier null check;
    // it is possible to have board ids set on project before
    // their models have been set in the ElementPropertiesMap
    previousBoards = boardIds.reduce<IBoardProperties[]>((acc, id: string) => {
      const props = elementProperties[id];
      if (props && isBoard(props)) {
        acc.push(props as IBoardProperties);
      }
      return acc;
    }, []);

    // If board properties have not been loaded yet,
    // the computed array of board will be missing boards
    // record whether any boards are missing, so when future updates
    // trigger, we will recompute boards
    boardsMissing = previousBoards.length !== boardIds.length;
    return previousBoards;
  }
);
