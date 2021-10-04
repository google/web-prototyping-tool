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
import { isDataBoundValue, styleForKey } from 'cd-common/utils';
import { getComponent, getPropsRecursive } from 'cd-common/models';
import { processCondition } from '../../properties/properties.utils';
import { REFERENCE_ID } from 'cd-common/consts';

const REMOVED_LABEL = '(removed)';

export enum RecordedInputType {
  None,
  Text,
  Number,
  StyleInput,
  Dropdown,
  Boolean,
  Portal,
}

export interface IElementChanges {
  changeIndex: number[];
  changes: cd.IActionStateChange[];
}

export const buildChangeListGroup = (
  stateChanges: cd.IActionStateChange[]
): ReadonlyMap<string, IElementChanges> => {
  return stateChanges.reduce<Map<string, IElementChanges>>(
    (acc, curr: cd.IActionStateChange, idx) => {
      const { elementId } = curr;
      if (!elementId) return acc;
      const elem = acc.get(elementId) || { changeIndex: [], changes: [] };
      elem.changes.push(curr);
      elem.changeIndex.push(idx);
      acc.set(elementId, elem);
      return acc;
    },
    new Map()
  );
};

export const calculateTotalTime = (values: cd.IActionStateChange[], minTime = 150): number => {
  return values.reduce<number>((acc, curr) => {
    const duration = curr?.animation?.duration ?? 0;
    const delay = curr?.animation?.delay ?? 0;
    const max = duration + delay;
    if (max > acc) acc = max;
    return acc;
  }, minTime);
};

export const timingFromStateChange = (state: cd.IActionStateChange): [number, number] => {
  const duration = state.animation?.duration ?? 0;
  const delay = state.animation?.delay ?? 0;
  return [delay, duration];
};

export const hasTimingApplied = (state: cd.IActionStateChange): boolean => {
  const [delay, duration] = timingFromStateChange(state);
  return duration > 0 || delay > 0;
};

export const labelForTime = (value: number, showZero = false, units = 'ms') => {
  return showZero || value > 0 ? `${value} ${units}` : '';
};

/**
 * Given a value such as border-radius:6px 6px 6px 6px;
 * This reduces the value to just 6px if all values are equal
 */
export const simplifyArrayOfValuesWhenEqual = (value: string): string => {
  const split = value.split(' ');
  const sameSplit = split.length > 1 && split.every((item) => item === split[0]);
  return sameSplit ? split[0] : value;
};

export const outputLabelForStyle = (
  key: string,
  value: any,
  designSystem: cd.IDesignSystem
): string => {
  const bindings: cd.IProjectBindings = { designSystem, assets: {} };
  const styleValue = value !== null ? styleForKey(key, value, bindings) : REMOVED_LABEL;
  return simplifyArrayOfValuesWhenEqual(styleValue);
};

const buildPortalRef = (
  item: cd.IPropertyGroup,
  targetId: string | undefined
): [string, cd.IPropertyGroup] => {
  return [REFERENCE_ID, { ...item, targetId }];
};

export const generateInputMap = (
  cmp: cd.IComponent | undefined,
  element: cd.PropertyModel
): Map<string, cd.IPropertyGroup> => {
  const props = (cmp?.properties && getPropsRecursive(cmp?.properties)) || [];
  const filtered = props
    .filter((item) => {
      if (!item.conditions) return true;
      return item.conditions.every((condition) => processCondition(condition, element));
    })
    .filter((item) => !!item.name || item.type === cd.PropertyType.BoardPortal);
  const outputs = cmp?.outputs || [];

  const processed = filtered.map((item) => {
    if (item.type === cd.PropertyType.BoardPortal) return buildPortalRef(item, element.rootId);
    return [item.name, item];
  }) as [string, cd.IPropertyGroup][];

  const mapped = new Map(processed);

  for (const output of outputs) {
    if (mapped.has(output.binding)) continue;
    // For select, radio buttons, ect we need to look at the outputs to find the value
    // changed when an option is selected and provide the context
    mapped.set(output.binding, { inputType: cd.PropertyInput.Select, name: output.context });
  }
  return mapped;
};

/** Handle looking up the label for radio buttons, select etc */
export const processDropdownLookupLabel = (
  element: cd.PropertyModel | undefined,
  key: string,
  value: any
): string | undefined => {
  const cmp = element && getComponent(element.elementType);
  if (!cmp || !element) return;
  const toMap = generateInputMap(cmp, element);
  const prop = toMap.get(key);

  if (prop?.inputType === cd.PropertyInput.Select) {
    const outputs = cmp?.outputs || [];
    const keyExistsInOutputs = outputs.find((item) => item.binding === key);
    if (element && keyExistsInOutputs && prop.name) {
      const valueList: { name: string; value: any }[] = (element?.inputs as any)?.[prop.name] || [];
      const label = valueList.find((item) => item.value === value)?.name;
      if (label) return label;
    }
  }
  return;
};

export const isNumberProperty = (inputType: cd.PropertyInput | undefined): boolean => {
  return (
    inputType === cd.PropertyInput.Number ||
    inputType === cd.PropertyInput.Integer ||
    inputType === cd.PropertyInput.Range ||
    inputType === cd.PropertyInput.PercentRange
  );
};

export const isTextProperty = (inputType: cd.PropertyInput | undefined, value: any): boolean => {
  const isText =
    inputType === cd.PropertyInput.Text ||
    inputType === cd.PropertyInput.TextArea ||
    inputType === cd.PropertyInput.RichText;
  return isText && !isDataBoundValue(value);
};

export const isDropdownProperty = (inputType: cd.PropertyInput | undefined): boolean => {
  return (
    inputType === cd.PropertyInput.Toggle ||
    inputType === cd.PropertyInput.Select ||
    inputType === cd.PropertyInput.SelectGrid
  );
};

export const recordInputTypeFromPropertyInputType = (
  prop: cd.IPropertyGroup | undefined,
  value: any
): RecordedInputType => {
  const inputType = prop?.inputType;
  if (prop?.type === cd.PropertyType.BoardPortal) return RecordedInputType.Portal;
  if (inputType === cd.PropertyInput.Checkbox) return RecordedInputType.Boolean;
  if (isNumberProperty(inputType)) return RecordedInputType.Number;
  if (isTextProperty(inputType, value)) return RecordedInputType.Text;
  if (isDropdownProperty(inputType)) {
    if (Array.isArray(value)) return RecordedInputType.None; // Multi-select
    if (prop?.name !== undefined) return RecordedInputType.Dropdown;
    console.warn('Actions: Missing output context for dropdown');
  }
  return RecordedInputType.None;
};
