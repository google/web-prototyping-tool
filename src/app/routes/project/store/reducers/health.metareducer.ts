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

import { isRoot, isSymbolInstance, getModels, isBoard, isSymbolDefinition } from 'cd-common/models';
import { findCircularRefs } from '../../utils/dependency.utils';
import { ElementPropertiesFixer } from './health.repair.utils';
import { environment } from 'src/environments/environment';
import * as cd from 'cd-interfaces';

const checkForCircularReferences = (elementProperties: cd.ElementPropertiesMap): string[] => {
  const circularRefs = findCircularRefs(elementProperties);
  if (circularRefs.length === 0) return [];

  /**
   * Format a string to display each circular reference path. Example:
   *
   * 1. id1 -> id2 -> id1
   * 2. id3 -> id4 -> id5 -> id3
   */
  const circularPathStrings = circularRefs.map((c, idx) => `\n${idx + 1}. ${c.join(' -> ')} \n`);
  return [`Circular references found: ${circularPathStrings.join('')}`];
};

const checkForOrphanedChildIds = (elementProperties: cd.ElementPropertiesMap): string[] => {
  const errors = [];
  const models = getModels(elementProperties);
  for (const element of models) {
    for (const childId of element.childIds) {
      if (elementProperties[childId] === undefined) {
        const msg = `Element: '${element.id}' includes a childId:'${childId}' that doesnt exist.`;
        errors.push(msg);
      }
    }
  }

  return errors;
};

const checkForOrphanedParentIds = (elementProperties: cd.ElementPropertiesMap): string[] => {
  const models = getModels(elementProperties);
  return models.reduce<string[]>((errors, element) => {
    const parentId = element.parentId;
    if (!isRoot(element) && parentId && !elementProperties[parentId]) {
      const msg = `Element: '${element.id}' has a parentId:'${parentId}' that doesnt exist.`;
      errors.push(msg);
    }
    return errors;
  }, []);
};

const checkForOrphanedRoots = (
  elementProperties: cd.ElementPropertiesMap,
  rootIds?: string[]
): string[] => {
  if (!rootIds || rootIds.length === 0) return [];

  const elementsMissingInRoots = rootIds.filter((id) => elementProperties[id] === undefined);
  const errors: string[] = [];
  for (const id of elementsMissingInRoots) {
    errors.push(`Project Root: '${id}' is missing from elementProperties`);
  }

  const elements: cd.PropertyModel[] = Object.values(elementProperties) as cd.PropertyModel[];
  const boards = elements.filter((item) => isBoard(item as cd.PropertyModel));
  const symbols = elements.filter((item) => isSymbolDefinition(item as cd.PropertyModel));
  const allElementRoots = [...boards, ...symbols].map((item) => item.id);
  const rootsMissingInElements = allElementRoots.filter((id) => !rootIds.includes(id));

  for (const id of rootsMissingInElements) {
    const elem = elementProperties[id];
    errors.push(`Element: '${id}' is missing from Project Roots ${elem?.elementType}`);
  }
  return errors;
};

const checkForElementWhoseRootDoesntExist = (
  elementProperties: cd.ElementPropertiesMap,
  rootIds?: string[]
): string[] => {
  if (!rootIds || rootIds.length === 0) return [];
  const models = getModels(elementProperties);
  return models.reduce<string[]>((errors, element) => {
    const { id, rootId } = element;
    if (rootIds.indexOf(rootId) === -1) {
      const msg = `Element: '${id}' has a reference to a root: ${rootId} that doesnt exist`;
      errors.push(msg);
    }
    return errors;
  }, []);
};

const checkIfElementExistInTheirParentsChildIds = (
  elementProperties: cd.ElementPropertiesMap
): string[] => {
  const models = getModels(elementProperties);
  return models.reduce<string[]>((errors, element) => {
    const parent = element.parentId && elementProperties[element.parentId];
    if (parent && parent.childIds.indexOf(element.id) === -1) {
      const msg = `ElementProperty: '${element.id}''s parent:'${parent.id}' does not include a childId for this element`;
      errors.push(msg);
    }
    return errors;
  }, []);
};

// For each symbol instance, check that there are no dirty inputs listed for elements that do not exist
export const checkForNonExistentDirtyInput = (
  elementProperties: cd.ElementPropertiesMap
): string[] => {
  const models = getModels(elementProperties);
  return models.reduce<string[]>((errors, element) => {
    if (isSymbolInstance(element)) {
      const { dirtyInputs } = element as cd.ISymbolInstanceProperties;
      const ids = Object.keys(dirtyInputs);

      for (const id of ids) {
        if (!elementProperties[id]) {
          const msg = `Non-existent dirty input listed: '${element.id} lists a dirty input for ${id} but it does not exist`;

          // In dev, health checks run after every action.
          // Non-existent dirty inputs are cleaned up in symbols.effect.ts with a secondary action
          // that occurs after an update/deletion in isolation mode.
          // Because of that, this health check with throw an error in the interstitial state between
          // update/deletion and the subsequent actiont to remove dirty inputs.
          // Therefore, in dev just log a warning for this health check.
          // In prod this is not an issue, since we only run health checks
          if (environment.production) {
            errors.push(msg);
          } else {
            console.warn(msg);
          }
        }
      }
    }
    return errors;
  }, []);
};

const checkIfChildIdsMatchesParentIdOfChild = (
  elementProperties: cd.ElementPropertiesMap
): string[] => {
  const models = getModels(elementProperties);
  return models.reduce<string[]>((errors, element) => {
    const { childIds, id } = element;
    for (const childId of childIds) {
      const child = elementProperties[childId];
      if (child && child.parentId !== id) {
        const msg = `Element: ${id} has a childId ${child.id} who is reporting a different parent ${child.parentId}`;
        errors.push(msg);
      }
    }
    return errors;
  }, []);
};

const checkForMissingDesignSystem = (designSystem?: cd.IDesignSystemDocument): string[] => {
  if (!designSystem) {
    return ['Missing design system document'];
  }
  return [];
};

const checkForSymbolInstancesMissingSymbolRef = (
  elementProperties: cd.ElementPropertiesMap
): string[] => {
  // Grab all symbol instances
  const models = getModels(elementProperties).filter(
    (item) => item.elementType === cd.ElementEntitySubType.SymbolInstance
  ) as cd.ISymbolInstanceProperties[];
  return models.reduce<string[]>((errors, element) => {
    const symbolRef = element.inputs.referenceId;
    if (!symbolRef) {
      errors.push(`SymbolInstance: ${element.id} is missing a referenceId`);
      return errors;
    }
    if (!elementProperties[symbolRef]) {
      const msg = `SymbolInstance: ${element.id} references an unknown symbol ${symbolRef}`;
      errors.push(msg);
    }
    return errors;
  }, []);
};

export const runAllHealthChecks = (
  elementProperties: cd.ElementPropertiesMap,
  designSystem: cd.IDesignSystemDocument | undefined,
  boardIds: string[],
  symbolIds: string[],
  logErrors: boolean
) => {
  const allRootIds = [...boardIds, ...symbolIds];
  const checks = [
    ...checkForOrphanedChildIds(elementProperties),
    ...checkForElementWhoseRootDoesntExist(elementProperties, allRootIds),
    ...checkForOrphanedRoots(elementProperties, allRootIds),
    ...checkForOrphanedParentIds(elementProperties),
    ...checkIfElementExistInTheirParentsChildIds(elementProperties),
    ...checkIfChildIdsMatchesParentIdOfChild(elementProperties),
    ...checkForNonExistentDirtyInput(elementProperties),
    ...checkForMissingDesignSystem(designSystem),
    ...checkForSymbolInstancesMissingSymbolRef(elementProperties),
    ...checkForCircularReferences(elementProperties),
  ];

  if (logErrors) {
    for (const error of checks) {
      console.error(error);
    }
  }

  return checks;
};

export const repairHealthIssues = (
  elementProperties: cd.ElementPropertiesMap,
  boardIds: string[],
  designSystem?: cd.IDesignSystemDocument
) => {
  return new ElementPropertiesFixer(elementProperties, designSystem, boardIds)
    .removeBoardsMissingFromProject()
    .repairOrphanedChildIds()
    .removeOrphanedElements()
    .repairChildIdsOnElementsWhoseChildrenDontPointToThem()
    .repairIfElementExistsOnTheirParent()
    .removeElementsWhoseParentIdDoesntExist()
    .removeSymbolInstancesWithNonMissingSymbolRefs()
    .repairNonExistentPortalOverrides()
    .repairNonExistentSymbolInstanceInputs()
    .repairTheme()
    .repairCircularReferences()
    .build();
};

export const getIdsForDeletedElements = (
  oldProps: cd.ElementPropertiesMap,
  newProps: cd.ElementPropertiesMap
): Set<string> => {
  const oldModels = getModels(oldProps);
  return new Set(oldModels.filter((item) => !newProps[item.id]).map((item) => item.id));
};
