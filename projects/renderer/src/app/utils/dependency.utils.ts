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

import type * as cd from 'cd-interfaces';
import {
  isSymbolInstance,
  isBoardPortal,
  isPortalParent,
  getModels,
  componentsWithPortalSlots,
} from 'cd-common/models';
import {
  getDataBindingElementId,
  getElementDataBoundInputs,
  hasElementDataBoundInputs,
} from 'cd-common/utils';
import { isString } from 'cd-utils/string';
import { isObject } from 'cd-utils/object';

/** When properties update, look for any references and update their boards */
const filterElementsWithDependencies = (props: cd.ElementPropertiesMap): cd.PropertyModel[] => {
  const models = getModels(props);
  return models.filter(
    (item) =>
      isSymbolInstance(item) ||
      isBoardPortal(item) ||
      isPortalParent(item) ||
      hasElementDataBoundInputs(item) ||
      componentsWithPortalSlots.has(item.elementType)
  );
};

/** Recursively check through input values to find instance of referenceId */
const inputValuesReferenceId = (id: string, inputs?: {} | cd.PropertyValue): boolean => {
  if (!inputs) return false;
  if (isString(inputs)) return inputs === id;
  if (!isObject(inputs)) return false;

  const values = Object.values(inputs);

  // If some of the input values are Arrays of objects (e.g. DynamicList inputs), then we need to
  // recursively search for any references to the id
  return values.some((v) => {
    if (v === id) return true;
    if (Array.isArray(v)) return v.some((arrayItem) => inputValuesReferenceId(id, arrayItem));
    return false;
  });
};

const getDependents = (
  id: string,
  filteredData: cd.PropertyModel[],
  props: cd.ElementPropertiesMap,
  dependencies: Set<string> = new Set()
) => {
  for (const item of filteredData) {
    // if dependencies already include this item's rootId, we can skip
    if (dependencies.has(item.rootId)) continue;

    // If a portal, or a component containing a portal slot
    if (isBoardPortal(item) || componentsWithPortalSlots.has(item.elementType)) {
      // check if the inputs value reference this id
      if (!inputValuesReferenceId(id, item.inputs)) continue;
      dependencies.add(item.rootId);
      const data = getDependents(item.rootId, filteredData, props, dependencies);
      if (data.size) dependencies = new Set([...data, ...dependencies]);
    }
    // if a portal parent (e.g. tabs) - check each child portal
    else if (isPortalParent(item)) {
      const childPortals = (item.inputs as cd.IPortalParentInputs)?.childPortals;
      for (const portal of childPortals) {
        if (portal.value !== id) continue;

        dependencies.add(item.rootId);
        const data = getDependents(item.rootId, filteredData, props, dependencies);
        if (data.size) dependencies = new Set([...data, ...dependencies]);
      }
    }
    // if a symbol instance, check for any portal overrides (e.g. referenceId)
    else if (isSymbolInstance(item)) {
      const instanceInputs = (item as cd.ISymbolInstanceProperties).instanceInputs;
      for (const instanceItem of Object.values(instanceInputs)) {
        const referenceId = (instanceItem.inputs as cd.IRootInstanceInputs)?.referenceId;
        if (referenceId !== id) continue;

        dependencies.add(item.rootId);
        const data = getDependents(item.rootId, filteredData, props, dependencies);
        if (data.size) dependencies = new Set([...data, ...dependencies]);
      }
    }

    // We check for data bound inputs regardless of element type
    const elementDataBoundInputs = getElementDataBoundInputs(item);

    // For each data-bound input, check to see if the rootId of the bound-to-element
    // is equal to the current passed in rootId
    // If so, rootId  of this item ((e.g. board/outlet that this element is on) is a dependent
    // of the current id
    for (const input of elementDataBoundInputs) {
      const elementIdDependency = getDataBindingElementId(input);
      const rootIdDependency = props[elementIdDependency]?.rootId;
      if (id === rootIdDependency) {
        dependencies.add(item.rootId);
        break;
      }
    }
  }
  return dependencies;
};

export const getDependentOutletsForIds = (
  ids: string[],
  props: cd.ElementPropertiesMap
): string[] => {
  const values = filterElementsWithDependencies(props);
  const dependents = ids.reduce((acc, id) => {
    const deps = getDependents(id, values, props);
    if (deps.size) acc = new Set([...acc, ...deps]);
    return acc;
  }, new Set<string>(ids));
  return [...dependents];
};

const getRefIdsForInstanceInputs = (instanceInputs: cd.SymbolInstanceInputs) => {
  return Object.values(instanceInputs).reduce((acc, curr) => {
    const portalInputs = curr?.inputs as cd.IPortalParentInputs & cd.IRootInstanceInputs;
    const refId = portalInputs?.referenceId;
    const childPortals = portalInputs?.childPortals;
    if (refId) acc.add(refId);
    if (childPortals) {
      for (const portal of childPortals) {
        if (portal.value) acc.add(portal.value);
      }
    }
    return acc;
  }, new Set<string>());
};

export const getDependenciesOfSymbolInstance = (
  instance?: cd.ISymbolInstanceProperties,
  props?: cd.ElementPropertiesMap
): Set<string> => {
  if (!instance || !props || !instance?.inputs.referenceId) return new Set<string>();
  const { instanceInputs } = instance;
  const referenceId = instance.inputs.referenceId;
  const refIds = getRefIdsForInstanceInputs(instanceInputs);
  const values = filterElementsWithDependencies(props);
  return [...refIds, referenceId].reduce((acc, id) => {
    const deps = getDependents(id, values, props);
    if (deps.size) acc = new Set([...acc, ...deps]);
    return acc;
  }, new Set<string>(refIds));
};
