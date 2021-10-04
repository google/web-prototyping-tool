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

import { areObjectsEqual, isObject } from 'cd-utils/object';
import { baseStylesPartial, getElementBaseStyles } from 'cd-common/utils';
import * as cd from 'cd-interfaces';

type IStylePayload = Omit<cd.IStyleAttributes, 'base'>;

export const payloadForStateChange = (change: cd.IActionStateChange) => {
  const { type, key, value, symbolChildId } = change;
  // prettier-ignore
  switch (type) {
    case cd.ActionStateType.Input: return addInputAttribute(key, value, symbolChildId);
    case cd.ActionStateType.Style: return addStyleAttribute(key, value, symbolChildId);
    case cd.ActionStateType.StyleOverride: return addStyleOverride(key, value);
  }
};

export const addStyleOverride = (state: string, overrides: cd.IKeyValue[]): IStylePayload => {
  return { styles: { [state]: { overrides } } };
};

type SymbolInstanceInputs = Pick<cd.ISymbolInstanceProperties, 'dirtyInputs' | 'instanceInputs'>;

export const generateInstanceInput = (
  symbolChildId: string,
  payload: object
): SymbolInstanceInputs => {
  const dirtyInputs = { [symbolChildId]: true };
  const instanceInputs = { [symbolChildId]: { ...payload } };
  return { dirtyInputs, instanceInputs };
};

export const addStyleAttribute = (
  key: string,
  value: object,
  symbolChildId?: string
): SymbolInstanceInputs | Partial<cd.PropertyModel> => {
  const payload = baseStylesPartial({ [key]: value });
  return symbolChildId ? generateInstanceInput(symbolChildId, payload) : payload;
};

export const addInputAttribute = (
  key: string,
  value: object,
  symbolChildId?: string
): SymbolInstanceInputs | Partial<cd.PropertyModel> => {
  const payload = { inputs: { [key]: value } };
  return symbolChildId ? generateInstanceInput(symbolChildId, payload) : payload;
};

export const createStateChange = (
  elementId: string,
  key: string,
  value: object,
  type: cd.ActionStateType,
  symbolChildId?: string
): cd.IActionStateChange => {
  // prettier-ignore
  // ensure if this value ever chagnes we get lint errors
  const symbolRef = symbolChildId && { symbolChildId } as Pick<cd.IActionStateChange, 'symbolChildId'>;
  return { elementId, key, type, value, ...symbolRef };
};

/** Checks to see if the list of changes for a specific element and key already exists */
const changesExistInState = (
  changes: cd.IActionStateChange[],
  elemId: string | undefined,
  key: string,
  symbolChildId?: string
): boolean => {
  if (!elemId) return false;
  return changes.some((item) => {
    return elemId === item.elementId && key === item.key && item?.symbolChildId === symbolChildId;
  });
};

const areValuesDifferent = (original: any, next: any): boolean => {
  if (original === undefined && next === null) return false;
  if (original === next) return false;
  if (isObject(original) && isObject(next)) return areObjectsEqual(original, next) === false;
  return true;
};

/**
 * This method checks a state change against the original value for this element and previously
 * recorded actions (initalState) The result allows us to filter out duplicate changes applied
 * @param change Merged change coming down the pipline of added actions
 * @param originalInputOrStyle The original state of the element before recording started
 * @param initalState The original state of actions applied to the elemebt before recording started
 */
export const didStateChange = (
  change: cd.IActionStateChange,
  original: any,
  initalState: cd.IActionStateChange[]
): boolean => {
  // This means a user has explicitly set the value
  // so we return true so the system thinks the value is change and will not remove
  if (change.persist) return true;

  const { elementId, value, key, type } = change;
  if (type === cd.ActionStateType.StyleOverride) {
    // Value is always an array of overrides, if it is empty we know to remove this state change
    if (value.length === 0) return false;
  }

  const isDifferent = areValuesDifferent(original, value);
  return isDifferent === false ? changesExistInState(initalState, elementId, key) : isDifferent;
};

const findMatchingChangeInList = (
  change: cd.IActionStateChange,
  updates: cd.IActionStateChange[]
): cd.IActionStateChange | undefined => {
  return updates.find((update) => {
    const { elementId, key, type } = update;
    return elementId === change.elementId && key === change.key && type === change.type;
  });
};

export const mergeAddedStateChange = (
  changes: cd.IActionStateChange[],
  stateChanges: cd.IActionStateChange[],
  initalStateChanges: cd.IActionStateChange[],
  propsSnapshot: cd.ElementPropertiesMap
) => {
  const mergedChanges = changes.map((change) => {
    const existing = findMatchingChangeInList(change, stateChanges);
    return existing === undefined ? change : { ...existing, ...change };
  });

  const currentState = [...stateChanges].filter((change) => {
    const { elementId, key } = change;
    return !changesExistInState(mergedChanges, elementId, key, change?.symbolChildId);
  });

  return [...currentState, ...mergedChanges].filter((item) => {
    const { elementId, type, key } = item;
    const id = elementId;
    if (!id) return true;
    const originalElement = propsSnapshot[id];
    if (!originalElement) {
      console.log('Recording: ignore missing element');
      return false;
    }

    const originalSource = elementSourceForType(type, originalElement, key);
    return didStateChange(item, originalSource, initalStateChanges);
  });
};

const elementSourceForType = (type: cd.ActionStateType, element: cd.PropertyModel, key: string) => {
  // prettier-ignore
  switch (type) {
    case cd.ActionStateType.Input: return (element?.inputs as any)?.[key];
    case cd.ActionStateType.Style: return getElementBaseStyles(element)?.[key];
    case cd.ActionStateType.StyleOverride: {
      if (!key) throw new Error('Missing state for style override')
      return element?.styles[key]?.overrides;
    }
    default: throw new Error('Unknown ActionStateType')
  }
};

export const filterInvalidOverrides = ({ name, value, disabled }: cd.IKeyValue) => {
  return !disabled && name !== '' && name !== undefined && value !== undefined;
};
