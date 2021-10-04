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

import { getModels, isSymbolInstance } from 'cd-common/models';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { OUTPUT_NONE_VALUE } from 'cd-common/consts';
import { deepCopy } from 'cd-utils/object';
import * as cd from 'cd-interfaces';

const isValueBoolean = (value: any): value is boolean => {
  return typeof value === 'boolean' || value === String(false) || value === String(true);
};

const filterBoardAppearActions = (action: cd.ActionBehavior) => {
  return action.trigger === cd.EventTrigger.BoardAppear;
};

const filterClickActions = (action: cd.ActionBehavior) => {
  return action.trigger === cd.EventTrigger.Click;
};
/**
 * Filter out recorded states that conflict with the output binding
 * For example, On Checked = false set checked = true on the current element
 */
const filterOutputEventConflicts = (
  action: cd.IActionBehaviorRecordState,
  id: string
): cd.IActionStateChange[] | undefined => {
  return action.stateChanges?.filter(({ elementId, key }) => {
    return !(elementId === id && key === action.outputEvent?.binding);
  });
};

const generateBoardAppearanceEventMap = (
  props: cd.ReadOnlyPropertyModelList
): Map<string, cd.ActionBehavior[]> => {
  return props
    .filter((item) => item.actions.some(filterBoardAppearActions))
    .reduce<Map<string, cd.ActionBehavior[]>>((acc, curr) => {
      const actionsForRoot = acc.get(curr.rootId) || [];
      const actions = curr.actions.filter(filterBoardAppearActions);
      // Fixes a bug where a runJS action w/ a boardAppearance action incorrectly
      // uses the board as the target instead of the element
      const runJSFix = actions.map((action) => {
        // If target is undefined, set that to the current element
        if (action.type === cd.ActionType.RunJS && !action.target) {
          return { ...action, target: curr.id };
        }
        return action;
      });
      const mergedActions = runJSFix.reduce((list, action) => {
        // Check for duplicates
        if (!list.some((item) => item.id === action.id)) {
          list.push(action);
        }
        return list;
      }, actionsForRoot);

      acc.set(curr.rootId, mergedActions);

      return acc;
    }, new Map());
};

/**
 * When an output event has toggle applied and is a boolean like switch or checkbox
 * Add the inverted state to remove changes in the opposite state
 */
const generateInvertedToggleOutputAction = (
  action: cd.IActionBehaviorRecordState,
  propsMap: cd.ElementPropertiesMap
): cd.IActionBehaviorRecordState | undefined => {
  const outputValue = action.outputEvent?.value;
  if (!isValueBoolean(outputValue)) return;
  const toggleClone = deepCopy(action);
  if (!toggleClone.outputEvent?.value) return;
  const inverseValue = String(!coerceBooleanProperty(outputValue));
  toggleClone.outputEvent.value = inverseValue;
  toggleClone.stateChanges = generateIActionToggleState(action, propsMap);
  return toggleClone;
};

const generateOutputEventMap = (
  props: cd.ReadOnlyPropertyModelList,
  propsMap: cd.ElementPropertiesMap
): Map<string, cd.ActionBehavior[]> => {
  return props
    .filter((item) => item.actions.some((action) => action.outputEvent !== undefined))
    .reduce<Map<string, cd.ActionBehavior[]>>((acc, curr) => {
      const actions = curr.actions
        .filter((action) => action.outputEvent !== undefined)
        .reduce<cd.ActionBehavior[]>((actionList, action) => {
          if (action.type !== cd.ActionType.RecordState) {
            actionList.push(action);
            return actionList;
          }

          const clone = deepCopy(action);
          const stateChanges = filterOutputEventConflicts(clone, curr.id);

          if (!stateChanges?.length) return actionList;

          clone.stateChanges = stateChanges;
          actionList.push(clone);

          if (clone.toggle) {
            // For toggle, generate an inverted output action for the original state
            const toggleAction = generateInvertedToggleOutputAction(clone, propsMap);
            if (toggleAction) actionList.push(toggleAction);
          }

          return actionList;
        }, []);

      acc.set(curr.id, actions);
      return acc;
    }, new Map());
};

/** Grab an input off an element's inputs object */
const inputLookup = (element: cd.RecursivePartial<cd.PropertyModel>, key: string) => {
  return (element?.inputs as any)?.[key];
};

/** Grab a base style off an element style object */
const baseStyleLookup = (element: cd.RecursivePartial<cd.PropertyModel>, key: string) => {
  const baseStyle: cd.IStyleDeclaration = element?.styles?.base?.style || {
    styles: { base: { style: {} } },
  };
  return baseStyle?.[key];
};

const styleOverrideLookup = (element: cd.PropertyModel, key: string) => {
  return element?.styles[key]?.overrides || [];
};

const elementSourceForType = (element: cd.PropertyModel, action: cd.IActionStateChange) => {
  const { type, key } = action;
  // prettier-ignore
  switch (type) {
    case cd.ActionStateType.Input: return inputLookup(element, key)
    case cd.ActionStateType.Style: return baseStyleLookup(element, key)
    case cd.ActionStateType.StyleOverride:  return styleOverrideLookup(element, key);
    default: return undefined;
  }
};

const symbolInstanceSourceForType = (
  element: cd.PropertyModel,
  action: cd.IActionStateChange,
  symbolChildId: string
) => {
  const { type, key } = action;
  const instanceInputs = (element as cd.ISymbolInstanceProperties).instanceInputs[symbolChildId];
  if (type === cd.ActionStateType.Input) return inputLookup(instanceInputs, key);
  if (type === cd.ActionStateType.Style) return baseStyleLookup(instanceInputs, key);
};

const initalValueForToggle = (change: cd.IActionStateChange, element: cd.PropertyModel) => {
  const { symbolChildId } = change;
  const isInstance = isSymbolInstance(element);
  return isInstance && symbolChildId
    ? symbolInstanceSourceForType(element, change, symbolChildId)
    : elementSourceForType(element, change);
};

const generateIActionToggleState = (
  action: cd.IActionBehaviorRecordState,
  propsMap: cd.ElementPropertiesMap
): cd.IActionStateChange[] => {
  const initalStates: cd.IActionStateChange[] = [];
  const stateChanges = action.stateChanges || [];
  for (const change of stateChanges) {
    const { elementId } = change;
    const element = elementId && propsMap[elementId];
    if (!element) continue;
    const initalValue = initalValueForToggle(change, element);
    const clone = deepCopy(change);
    const value = deepCopy(initalValue);
    initalStates.push({ ...clone, value });
  }
  return initalStates;
};

/** Filter out invalid toggle actions */
const filterRecordedToggleActions = (action: cd.ActionBehavior) => {
  return (
    action.type === cd.ActionType.RecordState &&
    action.trigger !== cd.EventTrigger.BoardAppear &&
    (action.toggle === true || action.trigger === cd.EventTrigger.Hover) &&
    action.stateChanges &&
    action.stateChanges?.length > 0 &&
    // If an output event has a toggle, such as a switch or checkbox
    // we generate an inverted action in the OutputEventsMap instead
    action.outputEvent === undefined
  );
};

const generateToggleActions = (
  props: cd.ReadOnlyPropertyModelList,
  propsMap: cd.ElementPropertiesMap
): Map<string, cd.IActionStateChange[]> => {
  return props
    .filter((item) => item.actions.some(filterRecordedToggleActions))
    .reduce<Map<string, cd.IActionStateChange[]>>((acc, element) => {
      const toggleActions = element.actions.filter(
        filterRecordedToggleActions
      ) as cd.IActionBehaviorRecordState[];

      for (const action of toggleActions) {
        if (!action.id) continue;
        const toggleState = generateIActionToggleState(action, propsMap);
        if (!toggleState.length) continue;
        acc.set(action.id, toggleState);
      }
      return acc;
    }, new Map());
};

/** List of element Ids per board with click actions */
const generateBoardClickActions = (props: cd.ReadOnlyPropertyModelList): Map<string, string[]> => {
  const clickActions = props.filter((item) => item.actions.some(filterClickActions));
  const boardClickElems = new Map<string, string[]>();
  for (const elem of clickActions) {
    const list = boardClickElems.get(elem.rootId) ?? [];
    list.push(elem.id);
    boardClickElems.set(elem.rootId, list);
  }
  return boardClickElems;
};

/**
 * This class maintains a mapping of all Board appearance acnd output event actions
 * Processing and storing in map for fast runtime lookups
 */
export class ActionEventMaps {
  public boardClickActions = new Map<string, string[]>();
  public boardAppearance = new Map<string, cd.ActionBehavior[]>();
  public outputEvents = new Map<string, cd.ActionBehavior[]>();
  public toggleActions = new Map<string, cd.IActionStateChange[]>();

  update(props: cd.ElementPropertiesMap) {
    const models = getModels(props);
    this.boardAppearance = generateBoardAppearanceEventMap(models);
    this.outputEvents = generateOutputEventMap(models, props);
    this.toggleActions = generateToggleActions(models, props);
    this.boardClickActions = generateBoardClickActions(models);
  }

  reset() {
    this.boardAppearance.clear();
    this.outputEvents.clear();
    this.toggleActions.clear();
  }

  actionsForBoard(rootId: string): cd.ActionBehavior[] {
    return this.boardAppearance.get(rootId) || [];
  }

  actionsForOutputEvents(elementId: string, input: cd.IStringMap<any>): cd.ActionBehavior[] {
    const outputActions = this.outputEvents.get(elementId);
    if (!outputActions) return [];
    return outputActions.filter((action) => {
      const binding = action.outputEvent?.binding;
      const inputValue = binding ? input[binding] : undefined;
      const outputValue = action.outputEvent?.value;
      const condition = action.outputEvent?.condition;
      if (inputValue === undefined) return false;

      if (outputValue === OUTPUT_NONE_VALUE) return true;
      if (condition) return evaluateCondition(condition, inputValue, outputValue);

      return isValueBoolean(inputValue)
        ? inputValue === coerceBooleanProperty(outputValue)
        : inputValue === outputValue;
    });
  }
}
/**
 * Conditions are only available for string and numeric values
 * Legacy interactions skip this check as do outputs based on select dropdowns (see menu, radio button, select, etc)
 */
const evaluateCondition = (
  condition: cd.OutputConditionType,
  inputValue: any,
  outputValue: cd.IOutputEvent['value']
): boolean => {
  // prettier-ignore
  switch (condition) {
    case cd.OutputCondition.None: return outputValue !== undefined; // Any value should call this action
    case cd.OutputCondition.Equals: return inputValue === outputValue;
    case cd.OutputCondition.NotEquals: return inputValue !== outputValue;
    case cd.OutputCondition.Includes: return inputValue.includes(outputValue)
    case cd.OutputCondition.NotIncludes: return !inputValue.includes(outputValue)
    // Evaluated as numbers
    case cd.OutputCondition.GreaterThan: return Number(inputValue) > Number(outputValue);
    case cd.OutputCondition.GreaterThanOrEqualTo: return Number(inputValue) >= Number(outputValue);
    case cd.OutputCondition.LessThan: return Number(inputValue) < Number(outputValue);
    case cd.OutputCondition.LessThanOrEqualTo: return Number(inputValue) <= Number(outputValue);
    default: return false;

  }
};

/** Recusively check if an element is has an ancestor with a specific id */
export const isElementAnAncestor = (
  elementId: string,
  ancestorId: string,
  elementProperties: cd.ElementPropertiesMap
): boolean => {
  const element = elementProperties[elementId];
  if (!element) return false;
  if (!element.parentId) return false;
  if (element.parentId === ancestorId) return true;
  return isElementAnAncestor(element.parentId, ancestorId, elementProperties);
};
