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

import { areObjectsEqual, deepCopy, isObject } from 'cd-utils/object';
import {
  applyChangeToElementContent,
  buildPropertyUpdatePayload,
  convertPropsUpdateToUpdateChanges,
  isIValue,
} from 'cd-common/utils';
import { nullifyPrevKeys } from './store.utils';
import * as cd from 'cd-interfaces';
import {
  findAllInstancesOfSymbol,
  getSymInstUpdate,
  updateExposedSymbolInputs,
} from './symbol.utils';
import { generateSymbolInstanceDefaults } from './symbol-overrides';
import { getChildren } from 'cd-common/models';

const collectChangesForInstanceInputs = (
  symbolUpdate: cd.SymbolInstanceInputs,
  existingInstance: cd.SymbolInstanceInputs
): [added: Set<string>, removed: Set<string>, unchanged: Set<string>] => {
  const added = new Set<string>();
  const removed = new Set<string>();
  const unchanged = new Set<string>(); // neither added or removed
  const update = new Set(Object.keys(symbolUpdate));
  const current = new Set(Object.keys(existingInstance));

  for (const id of update) {
    if (current.has(id)) {
      unchanged.add(id);
    } else {
      added.add(id);
    }
  }

  for (const id of current) {
    if (update.has(id)) {
      unchanged.add(id);
    } else {
      removed.add(id);
    }
  }

  return [added, removed, unchanged];
};

type DirtyInputs = cd.IStringMap<boolean | undefined | null>;

export const mergeNewInputsIntoInstances = (
  symInputs: cd.SymbolInstanceInputs,
  prevSymInputs: cd.SymbolInstanceInputs = {},
  currentSymInstances: cd.ISymbolInstanceProperties[]
): cd.IPropertiesUpdatePayload[] => {
  const update: cd.IPropertiesUpdatePayload[] = [];
  for (const instance of currentSymInstances) {
    const { id: elementId } = instance;
    const current = instance.instanceInputs;
    const [added, removed, existing] = collectChangesForInstanceInputs(symInputs, current);
    const instanceInputs: cd.SymbolInstanceInputs = {};
    ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////
    let dirtyInputs: DirtyInputs = {};
    let didUpdate = false; // optimization to prevent unnecessary writes

    for (const id of removed) {
      (instanceInputs as any)[id] = null;
      (dirtyInputs as any)[id] = null;
      didUpdate = true;
    }

    for (const id of added) {
      instanceInputs[id] = deepCopy(symInputs[id]);
      didUpdate = true;
    }

    for (const id of existing) {
      const currInput = current[id];
      const symInput = symInputs[id];
      const prevSymInput = prevSymInputs[id];
      const [updates, changed] = calcInstanceUpdates(symInput, prevSymInput, currInput);
      if (changed) {
        instanceInputs[id] = updates;
        didUpdate = true;
      }
    }

    if (!didUpdate) continue; // skip if there are no changes

    const changes = buildPropertyUpdatePayload(elementId, { instanceInputs, dirtyInputs });
    update.push(changes);
  }

  return update;
};

const nullifyIValueStylesWithoutId = (value: any): any => {
  if (isIValue(value)) {
    if ('id' in value) return value;
    return { ...value, id: null };
  }
  return value;
};

/**
 * Compare changes to instanceInputs to determine values
 * TODO: add tests
 * */
const didSymValueChange = (
  key: string,
  sym: any,
  prev: any,
  inst: any
): [value: any, changed: boolean] => {
  const symValue = (sym as any)[key];
  const prevValue = (prev as any)[key];
  const instValue = (inst as any)[key];
  const didSymChange = !areObjectsEqual(symValue, prevValue);
  const doesPrevMatchInst = areObjectsEqual(prevValue, instValue);
  if (!didSymChange && !doesPrevMatchInst) return [instValue, false];
  if (didSymChange && !doesPrevMatchInst) {
    if (key in inst) return [instValue, false];
  }
  const value = processInstanceValue(symValue, instValue);
  return [value, true];
};

const calcInstanceUpdates = (
  symInput: cd.RecursivePartial<cd.PropertyModel> = {},
  prevInput: cd.RecursivePartial<cd.PropertyModel> = {},
  instInput: cd.RecursivePartial<cd.PropertyModel> = {}
): [updates: cd.RecursivePartial<cd.PropertyModel>, changed: boolean] => {
  const inputs = {};

  let changed = false;
  const sInputs = symInput?.inputs || {};
  const pInputs = prevInput?.inputs || {};
  const iInputs = instInput?.inputs || {};
  const inputKeys = new Set([...Object.keys(iInputs), ...Object.keys(sInputs)]);
  for (const key of inputKeys) {
    const [value, valueChange] = didSymValueChange(key, sInputs, pInputs, iInputs);
    if (!valueChange) continue;
    (inputs as any)[key] = value;
    changed = true;
  }

  const sStyles = symInput?.styles || {};
  const pStyles = prevInput?.styles || {};
  const iStyles = instInput?.styles || {};
  const styles = {};

  for (const key of Object.keys(iStyles)) {
    const sStyle = (sStyles as any)[key]?.style || {};
    const pStyle = (pStyles as any)[key]?.style || {};
    const iStyle = (iStyles as any)[key]?.style || {};
    (styles as any)[key] = { style: {} };
    for (const styleKey of Object.keys(iStyle)) {
      const [value, valueChange] = didSymValueChange(styleKey, sStyle, pStyle, iStyle);
      if (!valueChange) continue;
      (styles as any)[key].style[styleKey] = nullifyIValueStylesWithoutId(value);
      changed = true;
    }
  }

  return [{ inputs, styles }, changed];
};

export const generatePreviousFromLegacy = (
  symbol: cd.ISymbolProperties
): cd.SymbolInstanceInputs => {
  const inputs = symbol?.symbolInputs;
  if (!inputs) return {};
  return {};
};

/** When updating instance inputs we need to find and nullify object values so they're removed properly */
export const processInstanceToNullifyChanges = (
  symInputs: cd.SymbolInstanceInputs,
  prevSymInputs: cd.SymbolInstanceInputs | undefined
): cd.SymbolInstanceInputs => {
  if (!prevSymInputs) return symInputs;
  const updates: cd.SymbolInstanceInputs = {};
  for (const [key, currInst] of Object.entries(symInputs)) {
    const prevInst = prevSymInputs[key];
    const inputs = diffAndNullifyInputChanges(currInst, prevInst);
    const styles = diffAndNullifyStyleChanges(currInst, prevInst);
    updates[key] = { inputs, styles };
  }
  return updates;
};

const diffAndNullifyInputChanges = (
  currInst: cd.RecursivePartial<cd.PropertyModel>,
  prevInst: cd.RecursivePartial<cd.PropertyModel>
): cd.PropertyModel['inputs'] => {
  const inputs = {};
  const sInputs = currInst?.inputs || {};
  const pInputs = prevInst?.inputs || {};
  for (const iKey of Object.keys(sInputs)) {
    const curr = (sInputs as any)[iKey];
    const prev = (pInputs as any)[iKey];
    (inputs as any)[iKey] = processInstanceValue(curr, prev);
  }
  return inputs;
};

const diffAndNullifyStyleChanges = (
  currInst: cd.RecursivePartial<cd.PropertyModel>,
  prevInst: cd.RecursivePartial<cd.PropertyModel>
): Partial<cd.IStyleAttributes> => {
  const sStyles = currInst?.styles || {};
  const pStyles = prevInst?.styles || {};
  const styles: Partial<cd.IStyleAttributes> = {};

  for (const sKey of Object.keys(sStyles)) {
    const sStyle = (sStyles as any)[sKey]?.style || {};
    const pStyle = (pStyles as any)[sKey]?.style || {};
    (styles as any)[sKey] = { style: {} };
    for (const styleKey of Object.keys(sStyle)) {
      const curr = (sStyle as any)[styleKey];
      const prev = (pStyle as any)[styleKey];
      (styles as any)[sKey].style[styleKey] = processInstanceValue(curr, prev);
    }
  }
  return styles;
};

const processInstanceValue = (curr: any, prev: any): any => {
  if (!prev) return curr;
  return isObject(curr) ? { ...nullifyPrevKeys(prev, curr), ...curr } : curr;
};

export const processPrevSymbolInputs = (
  symbol: cd.ISymbolProperties,
  instanceInputs: cd.SymbolInstanceInputs
): cd.SymbolInstanceInputs => {
  if (symbol.defaultInputs) return symbol.defaultInputs;
  if (!symbol.symbolInputs) return instanceInputs;
  const symbolInputs = symbol.symbolInputs;
  // Process legacy
  const updates: cd.SymbolInstanceInputs = {};
  for (const [key, curr] of Object.entries(instanceInputs)) {
    const legacy = symbolInputs[key] || [];
    updates[key] = processLegacyValue(legacy, curr);
  }
  return updates;
};

/**
 * @deprecated used to migrate legacy symbolInputs
 * TODO: add tests
 * */
const processLegacyValue = (
  legacy: cd.SymbolInput[],
  curr: cd.RecursivePartial<cd.PropertyModel>
): cd.RecursivePartial<cd.PropertyModel> => {
  const inputs: any = { ...curr.inputs };
  const styles = { ...curr.styles };
  for (const item of legacy) {
    const { controlType, defaultValue, targetKey } = item;
    if (controlType === cd.SymbolInputControl.Color) {
      if (styles?.base?.style) {
        styles.base.style.color = defaultValue;
      }
    } else if (controlType === cd.SymbolInputControl.RichText) {
      const { innerHTML, richText, textStyles } = defaultValue as cd.IRichTextInputValue;
      inputs.innerHTML = innerHTML;
      inputs.richText = richText;
      if (styles?.base?.style) {
        styles.base.style = { ...textStyles };
      }
    } else {
      inputs[targetKey] = defaultValue;
    }
  }
  return { inputs, styles };
};

export const computeSymbolInputUpdates = (
  isolatedSymbolId: string,
  elementContent: cd.ElementContent,
  incomingChange: cd.IElementChangePayload
): cd.IUpdateChange<cd.PropertyModel>[] => {
  // Calculate new symbol inputs based on results of change
  const updatedContent = applyChangeToElementContent(incomingChange, elementContent);
  const { records } = updatedContent;
  const symbol = records[isolatedSymbolId] as cd.ISymbolProperties;
  const symbolChildren = getChildren(symbol.id, records);
  const instanceInputs = generateSymbolInstanceDefaults(symbolChildren);
  const prevInputs = processPrevSymbolInputs(symbol, instanceInputs);
  const changes = processInstanceToNullifyChanges(instanceInputs, prevInputs);
  const exposedInputs = updateExposedSymbolInputs(symbol, symbolChildren);
  const symUpdate = getSymInstUpdate(isolatedSymbolId, changes, exposedInputs);
  // Propagate updated inputs to all instances of this symbol
  const instances = findAllInstancesOfSymbol(symbol.id, records);
  const updates = mergeNewInputsIntoInstances(instanceInputs, prevInputs, instances);
  const allUpdates = [symUpdate, ...updates];
  return convertPropsUpdateToUpdateChanges(allUpdates);
};
