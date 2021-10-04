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

import { instanceInputsForType } from '../../utils/symbol-overrides';
import { deepMerge, generateLockingFrame } from 'cd-common/utils';
import { isSymbolInstance, getModels } from 'cd-common/models';
import { half } from 'cd-utils/numeric';
import * as cd from 'cd-interfaces';

export type PropertyPartial = Partial<cd.PropertyModel>;
export type PropertyPanelType = cd.ComponentIdentity | cd.MixedCollection | undefined;

export interface IPropertiesPanelUpdate {
  ids: string[];
  properties: PropertyPartial;
}

const doSymbolInstancesHaveTheSameReference = (
  modelA: cd.IRootInstanceProperties,
  modelB: cd.IRootInstanceProperties
): boolean => {
  return modelA.inputs.referenceId === modelB.inputs.referenceId;
};

const areAllElementsSameType = (propsMap: cd.ElementPropertiesMap, ids: string[]): boolean => {
  return ids.every((id, i, arr) => {
    if (i === 0) return true;
    const currModel = propsMap[id];
    const prevModel = propsMap[arr[i - 1]];
    if (!currModel || !prevModel) return false;

    // Check to make sure all symbols are the same type
    if (isSymbolInstance(currModel) && isSymbolInstance(prevModel)) {
      return doSymbolInstancesHaveTheSameReference(
        currModel as cd.IRootInstanceProperties,
        prevModel as cd.IRootInstanceProperties
      );
    }

    return currModel.elementType === prevModel.elementType;
  });
};

export const calcElementSubtype = (
  propsMap: cd.ElementPropertiesMap,
  ids: string[]
): PropertyPanelType => {
  const [firstId] = ids;
  const firstModel = propsMap[firstId];
  if (!firstModel) return cd.MIXED_COLLECTION;
  return areAllElementsSameType(propsMap, ids) ? firstModel.elementType : cd.MIXED_COLLECTION;
};

export const calculateMaxPadding = (
  frame: cd.IRect | { width: number; height: number },
  percent = 0.5
): number => {
  // Get the shortest edge and divide it by 2
  const size = frame.width > frame.height ? frame.height : frame.width;
  return Math.floor(size * percent);
};

export const buildFrameFromPropsAndRenderRects = (
  props: cd.PropertyModel,
  rects: cd.RenderRectMap
): cd.ILockingRect => {
  const initalFrame = generateLockingFrame(props.frame.locked);
  return [...rects.entries()].reduce((acc, [, value]) => {
    const { width, height } = value.frame;
    if (acc.width < width) acc.width = width;
    if (acc.height < height) acc.height = height;
    return acc;
  }, initalFrame);
};

export const generateMaxBorderRadius = (rects: cd.RenderRectMap, minSize: number) => {
  return [...rects.entries()].reduce((acc, [, value]) => {
    const { width, height } = value.frame;
    const size = half(width > height ? width : height);
    if (size > acc) acc = size;
    return acc;
  }, minSize);
};

const symbolRefFromElement = (element: cd.PropertyModel): string | undefined => {
  if (!isSymbolInstance(element)) return;
  return (element as cd.ISymbolInstanceProperties).inputs.referenceId || undefined;
};

const buildSymChildSelectItem = (item: cd.PropertyModel): cd.ISelectItem => {
  const label = (item as any)?.inputs?.label;
  // Makes it easier to identify buttons and other form controls
  const suffix = label ? ` (${label})` : '';
  const title = item.name + suffix;
  const value = item.id;
  return { title, value };
};

export const generateSymbolChildren = (
  element: cd.PropertyModel,
  propsMap: cd.ElementPropertiesMap
): cd.ISelectItem[] => {
  const refId = symbolRefFromElement(element);
  if (!refId) return [];
  const exposed = (propsMap[refId] as cd.ISymbolProperties)?.exposedInputs;
  if (exposed) {
    return Object.entries(exposed).reduce<cd.ISelectItem[]>((acc, curr) => {
      const [id, value] = curr;
      if (!value) return acc;
      const item = propsMap[id];
      if (!item) return acc;
      const child = buildSymChildSelectItem(item);
      acc.push(child);
      return acc;
    }, []);
  }
  // Legacy
  return getModels(propsMap)
    .filter((item) => item.id !== refId && item.rootId === refId)
    .map((item) => {
      return buildSymChildSelectItem(item);
    });
};

export const filterEmpty = (updates: any[]) => updates.length > 0;

export const validEntityType = (type: PropertyPanelType): type is cd.ElementEntitySubType => {
  return !!type && type in cd.ElementEntitySubType;
};

export const mergeDatabaseUpdates = (
  updates: IPropertiesPanelUpdate[]
): cd.IPropertiesUpdatePayload[] => {
  const propsMap = new Map<string, cd.RecursivePartial<cd.PropertyModel>>();
  for (const update of updates) {
    for (const id of update.ids) {
      const ref = propsMap.get(id) || {};
      propsMap.set(id, deepMerge(ref, update.properties, false));
    }
  }
  return [...propsMap.entries()].reduce<cd.IPropertiesUpdatePayload[]>((acc, curr) => {
    const [elementId, properties] = curr;
    acc.push({ elementId, properties });
    return acc;
  }, []);
};

export const mergeUpdateBuffer = (updates: PropertyPartial[]): PropertyPartial => {
  return updates.reduce<PropertyPartial>(
    (acc, currUpdate) => deepMerge(acc, currUpdate, false),
    {}
  );
};

const isConditionInParent = (condition: cd.PropertyCondition): boolean => {
  const { type } = condition;
  const { EqualsInParent, NotEqualsInParent } = cd.PropConditionEquality;
  const { ExistsInParent } = cd.PropConditionExists;
  return type === EqualsInParent || type === NotEqualsInParent || type === ExistsInParent;
};

export const testValueEquality = (value: any, testValue?: any, testIfEqual = true): boolean => {
  if (testValue === undefined) return true;
  const isEqual = Array.isArray(testValue) ? testValue.includes(value) : value === testValue;
  return isEqual === testIfEqual;
};

export const processCondition = (
  condition: cd.PropertyCondition,
  mergedProps: cd.PropertyModel,
  parentMergedProps?: cd.PropertyModel
): boolean => {
  const isParentCondition = isConditionInParent(condition);
  const modelInputs = isParentCondition ? parentMergedProps?.inputs : mergedProps?.inputs;
  if (!modelInputs) return false;
  const inputs = modelInputs as cd.IStringMap<any>;

  switch (condition.type) {
    case cd.PropConditionEquality.Equals:
    case cd.PropConditionEquality.NotEquals:
    case cd.PropConditionEquality.EqualsInParent:
    case cd.PropConditionEquality.NotEqualsInParent:
      const value = inputs[condition.name];
      const testValue = condition.value;
      const { Equals, EqualsInParent } = cd.PropConditionEquality;
      const testIfEqual = condition.type === Equals || condition.type === EqualsInParent;
      return testValueEquality(value, testValue, testIfEqual);

    case cd.PropConditionExists.Exists:
    case cd.PropConditionExists.ExistsInParent:
      return !!inputs[condition.name];

    default:
      return false;
  }
};

export const canShowSymbolInputOverride = (
  exposed: boolean | undefined,
  inputs: cd.SymbolInput[] = []
): boolean => {
  if (exposed !== undefined) return exposed;
  return inputs.length > 0; // Handle legacy values
};

export const generateSymbolOverrideProp = (
  props: cd.PropertyModel,
  instanceInputs: cd.SymbolInstanceInputs,
  targetId: string
): cd.IPropertyGroup | undefined => {
  // Fix for b/183105562
  // If instanceInput has a undefined hidden property, look at the targetProperties
  const target = instanceInputs[targetId];
  if (target) {
    const children = instanceInputsForType(props, targetId) || [];
    const targetIsHidden = props.inputs?.hidden;
    const childIsHidden = target?.inputs?.hidden;
    const label = props.name;
    const enabled = childIsHidden === undefined ? !targetIsHidden : !childIsHidden;
    return { label, enabled, children, targetId };
  }
  return;
};
