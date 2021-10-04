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

import * as cd from 'cd-interfaces';
import { getModels } from 'cd-common/models';
import { findAllInstancesOfSymbol } from './symbol.utils';
import { filterBoards, filterSymbols } from './import.utils';

const getDependentsOfSymbol = (
  symbolId: string,
  elementProperties: cd.ElementPropertiesMap,
  dependents = new Set<string>()
): Set<string> => {
  const allInstancesOfSymbol = findAllInstancesOfSymbol(symbolId, elementProperties);

  return allInstancesOfSymbol.reduce<Set<string>>((acc, curr) => {
    const { rootId } = curr;
    const rootProps = elementProperties[rootId];

    // if symbol instance is contained within a board, we don't need to list as a dependent
    if (!rootProps || rootProps.elementType === cd.ElementEntitySubType.Board) return acc;

    // else if symbol instance is contained within another symbol, list symbol as a dependent
    // and recursively get dependents up the chain of the symbol
    // However, if a circular reference already exists, we don't want to create infinite recursion
    // with this function, so only recurse if we haven't already checked this rootId
    const rootIdAlreadyChecked = acc.has(rootId);
    if (rootIdAlreadyChecked) return acc;

    acc.add(rootId);
    const rootDependents = getDependentsOfSymbol(rootId, elementProperties, acc);
    acc = new Set([...rootDependents, ...acc]);

    return acc;
  }, dependents);
};

// Given the ID of an isolated symbol, return a set of symbol ids that should not
// be allowed to be inserted due to causing circular dependencies to be created.
export const getInvalidSymbolIds = (
  elementProperties: cd.ElementPropertiesMap,
  isolatedSymbolId?: string
): Set<string> => {
  if (!isolatedSymbolId) return new Set();
  const symbolDependents = getDependentsOfSymbol(isolatedSymbolId, elementProperties);
  return new Set([isolatedSymbolId, ...symbolDependents]);
};

/**
 * Return all paths containing circular references.
 * Example path: ['id1', 'id2', 'id1'];
 */
const findCircularRefsRecursive = (
  parentIds: string[],
  elementProperties: cd.ElementPropertiesMap,
  currentPath: string[] = []
): string[][] => {
  let circularRefs: string[][] = [];
  for (const id of parentIds) {
    const circularRefFound = currentPath.includes(id);
    const model = elementProperties[id];
    const path = [...currentPath, id];

    if (circularRefFound) {
      circularRefs.push(path);
      continue;
    }

    if (model?.childIds && model.childIds.length > 0) {
      const childCircularRefs = findCircularRefsRecursive(model?.childIds, elementProperties, path);
      circularRefs = [...circularRefs, ...childCircularRefs];
    }
  }
  return circularRefs;
};

export const findCircularRefs = (elementProperties: cd.ElementPropertiesMap): string[][] => {
  const models = getModels(elementProperties);
  const boards = filterBoards(models);
  const symbols = filterSymbols(models);
  const rootIds = [...boards, ...symbols].map((el) => el.id);
  return findCircularRefsRecursive(rootIds, elementProperties);
};
