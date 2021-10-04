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
import { DEFAULT_PER_INTERACTION_TYPE, OUTPUT_BINDING_BOOL } from './action-panel.config';
import { generateIDWithLength } from 'cd-utils/guid';
import { OUTPUT_NONE_VALUE } from 'cd-common/consts';
import { getComponent } from 'cd-common/models';

// Default is to assume 'name' property from IGenericConfig
const DEFAULT_CONTEXT_NAME_PROPERTY = 'name';
const DEFAULT_CONTEXT_VALUE_PROPERTY = 'value';

/** checks to see if there are any outputs marked as defaultTrigger */
export const actionTriggerForComponent = (element: cd.PropertyModel): string => {
  const outputs = getComponent(element.elementType)?.outputs;
  const outputTrigger = outputs?.find((item) => item.defaultTrigger === true)?.binding;
  return outputTrigger || cd.EventTrigger.Click;
};

export const buildActionOutputPartial = (
  trigger: cd.EventTriggerType,
  outputsConfig: ReadonlyArray<cd.IOutputProperty> = [],
  inputs: cd.IStringMap<any> = {}
): Pick<cd.ActionBehavior, 'trigger' | 'outputEvent'> => {
  const output = lookupOutput(trigger, outputsConfig);
  const value = getOutputDefaultValue(inputs, output);
  const condition = getDefaultOutputCondition(output);
  return { trigger, outputEvent: { binding: trigger, value, ...condition } };
};

export const isOutputBinding = (trigger: string): boolean => {
  return !Object.values(cd.EventTrigger).some((value) => value === trigger);
};

const generateActionId = (generateId = true): { id?: string } => {
  return generateId ? { id: generateIDWithLength(8) } : {};
};

const actionForOutputBinding = (
  type: cd.ActionType,
  trigger: string,
  element: cd.PropertyModel,
  generateId = true
): cd.ActionBehavior => {
  const initalAction = actionForType(type, trigger, generateId);
  const outputs = getComponent(element.elementType)?.outputs ?? [];
  const inputs = element.inputs ?? [];
  const outputEvent = buildActionOutputPartial(trigger as cd.EventTriggerType, outputs, inputs);
  return { ...initalAction, ...outputEvent };
};

export const actionForTypeAndElement = (
  type: cd.ActionType,
  elem: cd.PropertyModel
): cd.ActionBehavior => {
  const trigger = actionTriggerForComponent(elem);
  const hasOutputBindng = isOutputBinding(trigger);
  return hasOutputBindng
    ? actionForOutputBinding(type, trigger, elem)
    : actionForType(type, trigger);
};

const actionForType = (
  type: cd.ActionType,
  trigger: string = cd.EventTrigger.Click,
  generateId = true
): cd.ActionBehavior => {
  const defaultValue = DEFAULT_PER_INTERACTION_TYPE[type];
  console.assert(!!defaultValue, 'unknown action type');
  const id = generateActionId(generateId);
  return { type, trigger, ...defaultValue, ...id } as cd.ActionBehavior;
};

export const contextFromInputs = (
  inputs: cd.IStringMap<any>,
  context?: string,
  contextProperty?: string
): cd.ISelectItem[] => {
  if (!context) return [];
  const contextItems = (inputs[context] as cd.IStringMap<any>[]) || [];

  // If a contextProperty is configured, use its value as both title and value in the SelectItem
  // Otherwise, use default to using the name/value properties of IGenericConfig
  const selectItems: cd.ISelectItem[] = contextProperty
    ? contextItems.map(({ [contextProperty]: title }) => ({ title, value: title }))
    : contextItems.map((item) => {
        return {
          title: item[DEFAULT_CONTEXT_NAME_PROPERTY],
          value: item[DEFAULT_CONTEXT_VALUE_PROPERTY],
        };
      });

  return selectItems.map((item, idx) => {
    const title = !item.title ? `Option ${idx + 1}` : item.title;
    return { ...item, title };
  });
};

export const lookupOutput = (
  binding: string,
  outputEvents: ReadonlyArray<cd.IOutputProperty>
): cd.IOutputProperty | undefined => {
  return outputEvents.find((item) => item.binding === binding);
};

export const getMenuForPropertyType = (
  output: cd.IOutputProperty,
  inputs: cd.IStringMap<any>
): cd.ISelectItem[] => {
  // prettier-ignore
  switch (output.type) {
    case cd.OutputPropertyType.Boolean: return OUTPUT_BINDING_BOOL;
    case cd.OutputPropertyType.ListItemValue: return contextFromInputs(inputs, output.context, output.contextProperty);
    default: return [];
  }
};

/**
 * Used to determine if this output type is used in an <input> element vs menu
 */
const isOutputTypeGenericStringOrNumber = (type: cd.OutputPropertyType): boolean => {
  return type === cd.OutputPropertyType.String || type === cd.OutputPropertyType.Numeric;
};

export const getOutputDefaultValue = (
  inputs: cd.IStringMap<any>,
  output?: cd.IOutputProperty
): string => {
  if (!output) return '';
  const { type } = output;
  if (type === cd.OutputPropertyType.None) return OUTPUT_NONE_VALUE;
  if (isOutputTypeGenericStringOrNumber(type)) return '';
  const menu = getMenuForPropertyType(output, inputs);
  return menu[0] ? menu[0].value : '';
};

/** Action card conditionals are only available for string or number inputs not menus */
export const getDefaultOutputCondition = (
  output?: cd.IOutputProperty
): Partial<cd.IOutputEvent> => {
  if (!output) return {};
  const { type } = output;
  if (isOutputTypeGenericStringOrNumber(type)) return { condition: cd.OutputCondition.None };
  return {};
};

export const convertOverlayAlignment = (
  position: cd.ActionOverlayPosition,
  alignment: cd.ActionOverlayPosition
): cd.ActionOverlayPosition => {
  if (position === cd.ActionOverlayPosition.Top || position === cd.ActionOverlayPosition.Bottom) {
    if (alignment === cd.ActionOverlayPosition.Top) return cd.ActionOverlayPosition.Left;
    if (alignment === cd.ActionOverlayPosition.Bottom) return cd.ActionOverlayPosition.Right;
  }

  if (position === cd.ActionOverlayPosition.Left || position === cd.ActionOverlayPosition.Right) {
    if (alignment === cd.ActionOverlayPosition.Left) return cd.ActionOverlayPosition.Top;
    if (alignment === cd.ActionOverlayPosition.Right) return cd.ActionOverlayPosition.Bottom;
  }
  if (position === cd.ActionOverlayPosition.Center) {
    return cd.ActionOverlayPosition.Center;
  }

  return alignment;
};
