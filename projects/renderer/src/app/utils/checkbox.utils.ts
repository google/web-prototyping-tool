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
import { buildStateChange, rendererState } from '../state.manager';
import { isSymbolInstance } from 'cd-common/models';
import { IStateChange } from './interfaces';

type CheckboxState = Pick<cd.ICheckboxInputs, 'indeterminate' | 'checked'>;

const buildCheckboxPayload = (indeterminate: boolean, checked: boolean): CheckboxState => {
  return { indeterminate, checked };
};

const updateNestedCheckboxState = (
  elem: cd.ICheckboxProperties,
  value: boolean,
  instanceId?: string
): IStateChange[] => {
  const children = elem.inputs._children ?? [];
  const payload = buildCheckboxPayload(false, value);

  // If this has children, write to that value
  const changeList = children.map((id) => buildStateChange(id, payload, instanceId));
  // This ensures that the checkbox we clicked has the correct state
  if (children.length) changeList.push(buildStateChange(elem.id, payload, instanceId));

  return changeList;
};

const getSymbolInstanceInputs = (
  instance: cd.PropertyModel | undefined
): cd.SymbolInstanceInputs | undefined => {
  if (!instance) return undefined;
  if (!isSymbolInstance(instance)) return undefined;
  const symbolInstance = instance as cd.ISymbolInstanceProperties;
  return symbolInstance.instanceInputs;
};

/**
 * This will set the state of a parent checkbox based on their child's state
 * i.e if one of 3 nested (_children) checkboxes is set, the state of the parent is indeterminate
 */
const locateParentCheckboxesAndAssignState = (
  elem: cd.ICheckboxProperties,
  instanceId?: string
): IStateChange[] => {
  const elemId = elem.id;
  const elemRootId = elem.rootId;
  const list = Object.values(rendererState.mergedProperties) as cd.PropertyModel[];

  const allOutletCheckboxes = list.filter((item): item is cd.ICheckboxProperties => {
    const isRoot = item.rootId === elemRootId;
    const notElem = item.id !== elemId;
    return isRoot && notElem && item?.elementType === cd.ElementEntitySubType.Checkbox;
  });

  const parentCheckboxes = allOutletCheckboxes.filter((item) => {
    const nested = item?.inputs?._children || [];
    return nested.includes(elemId);
  });

  const instanceElement = instanceId ? rendererState.getElementById(instanceId) : undefined;
  const instanceInputs = getSymbolInstanceInputs(instanceElement);

  return parentCheckboxes.map((parent) => {
    const nested = parent.inputs._children ?? [];
    const nestedIds = nested.filter((childId): childId is string => childId !== undefined);

    const nestedProps = nestedIds
      .map((childId) => {
        const instance = instanceInputs && instanceInputs[childId];
        return instance || rendererState.getElementById(childId);
      })
      .filter((childCheckbox): childCheckbox is cd.ICheckboxProperties => {
        return childCheckbox !== undefined;
      });

    const isChecked = nestedProps.every((item) => item.inputs?.checked === true);
    const isIndeterminate = !isChecked && nestedProps.some((item) => item.inputs?.checked === true);
    const checked = isChecked && !isIndeterminate;
    const parentPayload = buildCheckboxPayload(isIndeterminate, checked);
    return buildStateChange(parent.id, parentPayload, instanceId);
  });
};

export const processCheckboxStateChange = (
  elem: cd.ICheckboxProperties,
  value: boolean,
  instanceId?: string
): IStateChange[] => {
  const childChanges = updateNestedCheckboxState(elem, value, instanceId);
  const parentChanges = locateParentCheckboxesAndAssignState(elem, instanceId);
  return [...childChanges, ...parentChanges];
};
