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
import { fromJS, List, Map as iMap } from 'immutable';
import { deepCopy } from 'cd-utils/object';
import { isDisplayInline, displayValueWithoutInlinePrefix } from './css.model.utils';
import { constructKebabCase } from 'cd-utils/string';
import { getElementBaseStyles } from './style.utils';

const STYLE_KEY = 'style';
const OBJECT_KEY = 'object';

// The default mergeDeep() function included with immutablejs
// will merge Arrays also.
// Implement our own recursive function here that will check if
// item to merge is an Array and if so, just override it with b.
// Otherwise, if not an Array -> merge
// see: https://github.com/immutable-js/immutable-js/issues/762

const immutableMerge = (a: any, b: any): any => {
  if (b === null || typeof b !== OBJECT_KEY) return b;
  return a && a.mergeWith && !List.isList(a) && !List.isList(b)
    ? a.mergeWith(immutableMerge, b)
    : b;
};

type iMapAnyType = iMap<string, any>;

/**
 * Recursively filter out null values from a nested Map and check to ensure that no undefined values exist
 * @param iMap Immutable Map
 */
const filterNullDeepAndCheckUndefined = (map: iMapAnyType): iMapAnyType => {
  const entries = map.entries() as IterableIterator<[string, any]>;
  let filteredMap = map;
  for (const [key, value] of entries) {
    if (key === undefined) {
      throw new Error(`Attempted to merge undefined - key: ${key}  value: ${value}`);
    }
    if (value === null || value === undefined) {
      filteredMap = filteredMap.delete(key);
    } else if (iMap.isMap(value)) {
      filteredMap = filteredMap.set(key, filterNullDeepAndCheckUndefined(value as iMapAnyType));
    }
  }

  return filteredMap;
};

export const deepMerge = (a: any, b: any, performDeletes = true): any => {
  const iA = fromJS(a) as iMapAnyType;
  const iB = fromJS(b) as iMapAnyType;
  const iMerge = immutableMerge(iA, iB);
  // publishing a property value of null to the store signifies that it should be deleted
  // So filter out all null values (i.e. delete them) after merging
  // Write an undefined value will cause writes to the database to fail, so this function
  // will check if an undefined value exists and throw an error if so
  return performDeletes ? filterNullDeepAndCheckUndefined(iMerge).toJS() : iMerge.toJS();
};

/**
 * Merge utility that when encountering IValues inside of style object will not merge
 * IValue object, but overwrite a with b.
 *
 * example
 * a IValue: { id: 'Text' value: '#333333' }
 * b IValue: { value: '#ff0000 }
 *
 * merged result: { value: '#ff0000 }
 *
 * The generic merge utility above would merge these object and result in id and value being present
 * in the resulting object
 *
 * This is currently used for when merging overrides of a symbol instance onto the underlying
 * symbol definition
 */

const iValueOverride = (_a: any, b: any): any => b; // for any collisions within the style object, just use b.

const mergeStyleValues = (a: any, b: any, key: string): any => {
  if (b === null || typeof b !== OBJECT_KEY) return b;
  if (key === STYLE_KEY && a && a.mergeWith && !List.isList(a) && !List.isList(b)) {
    return a.mergeWith(iValueOverride, b);
  }
  if (a && a.mergeWith && !List.isList(a) && !List.isList(b)) {
    return a.mergeWith(mergeStyleValues, b);
  }
  return b;
};

const deepMergeHandleStyles = (
  a: cd.PropertyModel,
  b: cd.RecursivePartial<cd.PropertyModel>
): cd.PropertyModel => {
  const iA = fromJS(a) as iMapAnyType;
  const iB = fromJS(b) as iMapAnyType;
  const iMerge = iA.mergeWith(mergeStyleValues, iB).toJS();
  return iMerge as unknown as cd.PropertyModel;
};

const deepMergeStyles = (
  styleA: cd.IStyleDeclaration,
  styleB: cd.IStyleDeclaration
): cd.IStyleDeclaration => {
  const iA = fromJS(styleA) as iMapAnyType;
  const iB = fromJS(styleB) as iMapAnyType;
  return iA.mergeWith(mergeStyleValues, iB).toJS();
};

/**
 * If a user changes the display value of a symbol instance this may break how child elements are displayed,
 * For example, a symbol's root element has display:grid, and a user changes the instance to display:block
 * This utility automatically adjusts the styles according to the context
 */
const mergeDisplayValues = (
  instanceProps: cd.ISymbolInstanceProperties,
  symbolProps: cd.ISymbolProperties
) => {
  const instanceDisplayStyle = getElementBaseStyles(instanceProps)?.display;
  const symbolDisplayStyle = getElementBaseStyles(symbolProps)?.display;

  if (!instanceDisplayStyle) return symbolDisplayStyle;
  if (!symbolDisplayStyle) return instanceDisplayStyle;

  const instanceIsInline = isDisplayInline(instanceDisplayStyle);
  const symbolDefIsInline = isDisplayInline(symbolDisplayStyle);
  // If instance is inlined and symbol definition is not, return the inlined version of the symbol style
  if (instanceIsInline && !symbolDefIsInline) {
    return constructKebabCase(cd.Display.Inline, symbolDisplayStyle);
  }

  if (!instanceIsInline && symbolDefIsInline) {
    return displayValueWithoutInlinePrefix(symbolDisplayStyle);
  }

  return symbolDisplayStyle;
};

const IGNORED_SYMBOL_INSTANCE_STYLES = [
  'position',
  'display',
  'float',
  'width',
  'height',
  'top',
  'right',
  'bottom',
  'left',
  'margin',
  'overflow',
  'opacity',
  'cursor',
  'z-index',
];

/** Remove styles from the symbol that would cause conflict with the symbol instance */
const sanitizeBaseInstanceStyles = (symbolProps: cd.ISymbolProperties) => {
  const symbolStyles = getElementBaseStyles(symbolProps) || {};
  const style = Object.entries(symbolStyles).reduce<cd.IStyleDeclaration>((acc, curr) => {
    const [key, value] = curr;
    if (IGNORED_SYMBOL_INSTANCE_STYLES.includes(key)) return acc;
    acc[key] = value;
    return acc;
  }, {});
  Object.assign(symbolProps.styles.base, { style });
  return symbolProps;
};

const mergeInstanceIntoSymbol = (
  instanceProps: cd.ISymbolInstanceProperties,
  symbolProps: cd.ISymbolProperties
): cd.ISymbolProperties => {
  const clone = sanitizeBaseInstanceStyles(deepCopy(symbolProps));
  for (const [key, symbolStyles] of Object.entries(clone.styles)) {
    const symbolStyle = symbolStyles?.style || {};
    const symbolOverrides = symbolStyles?.overrides || [];
    const instanceStyles = instanceProps.styles[key];
    const instanceStyle = instanceStyles?.style || {};
    const instanceOverrides = instanceStyles?.overrides || [];
    const overrides = [...symbolOverrides, ...deepCopy(instanceOverrides)];
    const style = deepMergeStyles(symbolStyle, instanceStyle);
    const styles = { style, overrides };
    clone.styles[key] = styles;
  }
  const display = mergeDisplayValues(instanceProps, symbolProps);
  Object.assign(clone.styles.base.style, { display });
  return clone;
};

export const mergeInstanceOverrides = (
  instance: cd.ISymbolInstanceProperties,
  elementProperties: cd.ElementPropertiesMap
): cd.ElementPropertiesMap => {
  const { instanceInputs, dirtyInputs, inputs } = instance;
  const { referenceId } = inputs;
  const dirtyInputKeys = Object.keys(dirtyInputs);
  const mergedProps = { ...elementProperties };
  // in addition to merging overrides on child elements of a symbol ,
  // we need to merge styles set on the instance into the symbol root styles
  if (referenceId && referenceId in mergedProps) {
    const symbolProps = mergedProps[referenceId] as cd.ISymbolProperties;
    mergedProps[referenceId] = mergeInstanceIntoSymbol(instance, symbolProps);
  }

  if (dirtyInputKeys.length === 0) return mergedProps;

  for (const key of dirtyInputKeys) {
    const currentProps = elementProperties[key];
    if (!currentProps) continue;
    const overrides = instanceInputs[key] || {};

    mergedProps[key] = deepMergeHandleStyles(currentProps, overrides);
  }

  return mergedProps;
};

export const mergeUpdatesIntoElementProperties = (
  updates: cd.IPropertiesUpdatePayload[],
  elementProps: cd.ElementPropertiesMap
): cd.IMergeUpdatesResult => {
  const elementProperties = { ...elementProps };
  const updatedIds = new Set<string>();

  for (const update of updates) {
    const { elementId, properties } = update;
    const currentProps = elementProperties[elementId];
    updatedIds.add(elementId);

    // if there are current props, merge in updates
    if (currentProps) {
      const mergedProps = deepMerge(currentProps, properties);
      elementProperties[elementId] = mergedProps;
    }
    // if no current props, just set as incoming properties
    else {
      // TODO: how can we guarantee that when an update
      // adds a new model, it passes in a full PropertyModel (i.e. not a partial)
      elementProperties[elementId] = properties as cd.PropertyModel;
    }
  }

  return { elementProperties, updatedIds };
};
