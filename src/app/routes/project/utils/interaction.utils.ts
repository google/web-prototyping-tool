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

import * as utils from '../services/record-action/record-action.utils';
import * as cd from 'cd-interfaces';
import { deepMerge } from 'cd-common/utils';

export type ElementChangesMap = Map<string, cd.PropertyModel[]>;

interface IExtractedPropertyModel {
  baseStyles: cd.IStyleDeclaration | undefined;
  inputs: cd.PropertyModelInputs;
  instanceInputs: cd.SymbolInstanceInputs;
  styleOverrides: boolean;
  styles: cd.IStyleAttributes;
}

type StateChangeValueTypes =
  | cd.SymbolInstanceInputs
  | cd.IStyleDeclaration
  | cd.PropertyModelInputs;

/** Does this style object have overrides applied? */
export const styleHasOverrides = (styles: cd.IStyleAttributes): boolean => {
  return styles && Object.values(styles).some((item) => item?.overrides !== undefined);
};

/**
 * extract key values from state change object, add to a map of changes passed in
 * The map is used to override conflicting data:
 * Rough example
 * change.set('width', '12px')
 * */
export const addStateChangeToMap = (
  obj: StateChangeValueTypes | undefined,
  changes: Map<string, StateChangeValueTypes>
): void => {
  if (!obj) return;
  for (const [key, value] of Object.entries(obj)) {
    changes.set(key, value);
  }
};

export const buildChangeList = (
  id: string,
  actionType: cd.ActionStateType,
  changes: Map<string, any>,
  symbolRefId?: string
): cd.IActionStateChange[] => {
  const changeList: cd.IActionStateChange[] = [];
  for (const [key, value] of changes.entries()) {
    const item = utils.createStateChange(id, key, value, actionType, symbolRefId);
    changeList.push(item);
  }
  return changeList;
};

/** When a partial recorded property model comes in, we extract specific values needed used */
export const changesFromModel = (change: cd.PropertyModel): IExtractedPropertyModel => {
  const styles = change?.styles;
  const baseStyles = styles?.base?.style;
  const inputs = change?.inputs;
  const instanceInputs = (change as cd.ISymbolInstanceProperties)?.instanceInputs;
  const styleOverrides = styleHasOverrides(styles);
  return { styles, baseStyles, inputs, instanceInputs, styleOverrides };
};

/**
 * Extract recorded changes to style overrides for an element
 * `{ styles:{ [state]: { style, overrides <- THIS
 */
export const buildStyleOverrides = (
  styles: cd.IStyleAttributes,
  state: string,
  currentElement: cd.PropertyModel
): cd.IKeyValue[] => {
  const styleState = styles[state]?.overrides || [];
  const elementOverridesForState = currentElement.styles[state]?.overrides || [];
  const mergedUpdates: cd.IKeyValue[] = deepMerge(elementOverridesForState, styleState);
  return mergedUpdates.filter(utils.filterInvalidOverrides);
};

/**
 * Updates to a symbol instance are in the following format
 * `{ instanceInputs:{ inputs:{}, styles:{ base:{ style } }}}`
 * So we need to extact each input and style as individual state changes
 * and attach a reference to the symbol (symbolRefId)
 */
export const buildInstanceChanges = (
  elementId: string,
  symbolRefId: string,
  value: cd.RecursivePartial<cd.PropertyModel>
): cd.IActionStateChange[] => {
  const { baseStyles, inputs } = changesFromModel(value as cd.PropertyModel);
  const stylesToUpdate = new Map<string, cd.IStyleDeclaration>();
  const inputsToUpdate = new Map<string, cd.PropertyModelInputs>();
  addStateChangeToMap(baseStyles, stylesToUpdate);
  addStateChangeToMap(inputs, inputsToUpdate);
  return [
    ...buildChangeList(elementId, cd.ActionStateType.Style, stylesToUpdate, symbolRefId),
    ...buildChangeList(elementId, cd.ActionStateType.Input, inputsToUpdate, symbolRefId),
  ];
};

/** Flatten the instance  */
export const flattenSymbolInstanceActionChangeMap = (
  actionMap: Map<string, cd.IActionStateChange[]>
): cd.IActionStateChange[] => {
  return Array.from(actionMap.values()).reduce((acc, curr) => acc.concat(curr), []);
};
