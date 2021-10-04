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

/* eslint-disable max-lines */
import {
  PostMessageResetElementState,
  PostMessageResetAll,
  PostMessageToast,
} from 'cd-common/services';
import { rendererState, elementIsSymbolInstanceGaurd } from '../state.manager';
import { ScrollBehavior, TEMPLATE_ID_ATTR } from 'cd-common/consts';
import { messagingService } from '../utils/messaging.utils';
import { isElementAnAncestor } from './action.utils';
import { deepCopy } from 'cd-utils/object';
import * as mUtils from 'cd-common/models';
import * as cd from 'cd-interfaces';

export type ElementCacheType = Map<string, HTMLElement | HTMLElement[]>;
export type StyleCacheType = Map<string, CSSStyleDeclaration>;

export const isInstanceOfASymbol = (instanceId: string | undefined): boolean => {
  const element = instanceId && rendererState.getElementById(instanceId);
  return !!element && elementIsSymbolInstanceGaurd(element);
};

const isElementAChildOfSymbol = (elementId: string, symbolId: string) => {
  const element = rendererState.getElementById(elementId);
  return element?.rootId === symbolId;
};

/** Detect actions that occur inside a symbol and apply them to the instance instead */
export const evaluateActionForSymbolInstanceChanges = (
  action: cd.IActionBehaviorRecordState,
  instanceId?: string
): cd.IActionBehaviorRecordState => {
  const isSymbolInstance = isInstanceOfASymbol(instanceId);
  // For portals we do want to modify state changes globally
  if (!isSymbolInstance) return action;
  // This takes the elementId and moves it into symbolChildId,
  // Then takes makes the symbol instance the elementId to ensure actions are only applied
  // to the symbol instance the user wanted. Fixes b/154568585
  const cloneActions = deepCopy(action);
  cloneActions.stateChanges = updateStateChangesForSymbolInstance(
    instanceId,
    cloneActions.stateChanges
  );
  return cloneActions;
};

const symbolIdFromInstanceId = (instanceId: string): string | null => {
  return (rendererState.getElementById(instanceId)?.inputs as cd.IRootInstanceInputs)?.referenceId;
};

export const updateStateChangesForSymbolInstance = (
  instanceId: string | undefined,
  stateChanges: cd.IActionStateChange[] = []
): cd.IActionStateChange[] => {
  if (!instanceId) return stateChanges;
  const symbolId = symbolIdFromInstanceId(instanceId);
  if (!symbolId) return stateChanges;

  return stateChanges.map((item) => {
    const clone = { ...item };

    if (!item.elementId || !isElementAChildOfSymbol(item.elementId, symbolId)) return clone;
    if (clone.symbolChildId) {
      console.warn('State Change already has a reference to a symbol instance');
    }

    // There is an action inside a symbol attached to the root
    if (symbolId === item.elementId) {
      clone.elementId = instanceId;
      return clone;
    }

    // There is a child inside a symbol with an action
    clone.symbolChildId = clone.elementId;
    clone.elementId = instanceId;
    return clone;
  });
};

/** Extract duration and delay or return default values */
export const durationAndDelayFromStateChange = (
  target: cd.IActionStateChange
): { duration: number; delay: number } => {
  const duration = Number(target.animation?.duration ?? 0);
  const delay = Number(target.animation?.delay ?? 0);
  return { duration, delay };
};

const selectDOMElementWithTemplateId = (templateId: string, node: HTMLDocument | Element) => {
  const selector = mUtils.wrapInBrackets(`${TEMPLATE_ID_ATTR}*='${templateId}'`);
  return node.querySelector(selector);
};

/**
 * Given a MouseEvent filter ActionEvent Triggers
 * Hover is handled in a special way so we need to check for MouseEnter and MouseLeave
 */
const filterActionsForTrigger = (
  evtTrigger: string,
  actions: cd.ActionBehavior[] = [],
  same = false
): cd.ActionBehavior[] => {
  return actions.filter(({ trigger: tr }) => {
    const enterLeave = tr === cd.EventTrigger.MouseLeave || tr === cd.EventTrigger.MouseEnter;
    if (enterLeave && same) return false;
    if (tr !== cd.EventTrigger.Hover) return tr === evtTrigger;
    return evtTrigger === cd.EventTrigger.MouseLeave || evtTrigger === cd.EventTrigger.MouseEnter;
  });
};

const actionsForSymbolInstance = (
  props: cd.PropertyModel,
  elementProperties: cd.ElementPropertiesMap,
  trigger: string
): cd.ActionBehavior[] => {
  if (!mUtils.isSymbolInstance(props)) return [];
  // If this is a symbol instance, merge any actions attached to symbols
  const symbolId = (props?.inputs as cd.IRootInstanceInputs)?.referenceId;
  const symbolProps = symbolId && elementProperties[symbolId];
  return symbolProps ? filterActionsForTrigger(trigger, symbolProps.actions) : [];
};

export const actionsForTrigger = (
  trigger: string,
  originalId: string,
  elementId: string,
  elementProperties: cd.ElementPropertiesMap,
  instanceId?: string | undefined
): cd.ActionBehavior[] => {
  const props = elementProperties[elementId];
  if (!props) return [];

  const instanceActions = actionsForSymbolInstance(props, elementProperties, trigger);
  const same = originalId !== elementId;
  const filteredActions = filterActionsForTrigger(trigger, props.actions, same);
  const actions = [...instanceActions, ...filteredActions];
  if (actions.length) return actions;

  // If actions are not found, go up recursively until found

  const { parentId } = props;
  const parentProps = parentId && elementProperties[parentId];
  // If has a parentId && parent is not a Symbol definition
  if (parentProps && !mUtils.isSymbolDefinition(parentProps)) {
    return actionsForTrigger(trigger, originalId, parentProps.id, elementProperties, instanceId);
  }

  // If props are a symbol grab instance Id
  if (mUtils.isSymbol(props) && instanceId && elementId !== instanceId) {
    return actionsForTrigger(trigger, originalId, instanceId, elementProperties, instanceId);
  }

  // Allows users to attach events to board portals
  const instanceProps = instanceId && elementProperties[instanceId];
  if (instanceProps && mUtils.isBoardPortal(instanceProps)) {
    return actionsForTrigger(trigger, originalId, instanceId as string, elementProperties);
  }

  // If this this parent is a symbol grab actions on instance of that symbol
  if (parentProps && mUtils.isSymbol(parentProps) && instanceId) {
    return actionsForTrigger(trigger, originalId, instanceId, elementProperties);
  }

  return [];
};

export const getRootIdsInActionStateChanges = (
  stateChanges: cd.IActionStateChange[],
  elementProperties: cd.ElementPropertiesMap
): string[] => {
  const rootIdSet = stateChanges.reduce<Set<string>>((acc, curr) => {
    const { elementId } = curr;
    const targetModel = elementId && elementProperties[elementId];
    if (targetModel) acc.add(targetModel.rootId);
    return acc;
  }, new Set());

  return Array.from(rootIdSet);
};

export interface IAnimationGroup {
  to: cd.IStringMap<any>;
  from: cd.IStringMap<any>;
}

/**
 * Helper function to lookup, return or assign a value to a map based on an id
 */
export const fromMapOrAssign = <T>(
  id: string,
  mapRef: Map<string, any>,
  assign: () => T | undefined
): T | undefined => {
  if (mapRef.has(id)) return mapRef.get(id) as T;
  const item = assign();
  if (!item) return;
  mapRef.set(id, item);
  return item;
};

/**
 * Given an element and a map, get computedstyles and add value to the map for caching
 * If the element already exists in the map, return the value
 */
export const getComputedStylesAndCache = (
  element: Element,
  key: string,
  cacheMap: StyleCacheType
) => {
  return fromMapOrAssign(key, cacheMap, () => window.getComputedStyle(element));
};

/**
 * Lookup elements in the renderer by their templateId [data-id]
 * and return that value, but also save it into the provided map (cache)
 * So subsequent requests are fast.  This map is cleared at the end of the animation playback iterator
 */
export const getElementAndCache = (
  node: Element | HTMLDocument,
  id: string,
  cacheMap: ElementCacheType,
  cacheKey?: string
) => {
  const key = cacheKey ?? id;
  return fromMapOrAssign(key, cacheMap, () => selectDOMElementWithTemplateId(id, node));
};

export const getAllElements = (
  node: Element | HTMLDocument,
  id: string,
  cacheMap: ElementCacheType,
  cacheKey?: string
) => {
  const key = cacheKey ?? id;
  const selector = mUtils.wrapInBrackets(`${TEMPLATE_ID_ATTR}*='${id}'`);
  return fromMapOrAssign(key, cacheMap, () => Array.from(node.querySelectorAll(selector)));
};

/** Check to see if delay or duration is applied, if not we dont need to compute animations */
export const hasValidAnimation = (change: cd.IActionStateChange): boolean => {
  const { animation } = change;
  if (!animation) return false;
  const { delay, duration } = durationAndDelayFromStateChange(change);
  return duration + delay > 0;
};

export class StateChangeDelayTimer {
  private _timers = new Map<string, number[]>();

  clearForAction(key: string) {
    const timers = this._timers.get(key);
    if (!timers) return;
    for (const timer of timers) {
      window.clearTimeout(timer);
    }
    this._timers.delete(key);
  }

  clearAll() {
    for (const timers of this._timers.values()) {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    }
    this._timers.clear();
  }

  addTimerOrExecute(key: string, delay: number, fn: () => void) {
    if (delay === 0) return fn();
    const actionTimers = this._timers.get(key) ?? [];
    actionTimers.push(window.setTimeout(fn, delay));
    this._timers.set(key, actionTimers);
  }
}

/**
 * Symbols instances actions support a childRef attribute which is used to allow users to pick an element inside a symbol as the element trigger
 * (User see this as a "FROM") Actions with childRef need to be filtered to make sure the action is coming from that element not elsewhere in the symbol
 */
export const filterSymbolInstanceActions = (
  elementId: string,
  actions: cd.ActionBehavior[],
  props: cd.ElementPropertiesMap
) => {
  return actions.filter((item) => {
    if (!item.childRef || elementId === item.childRef) return true;
    return isElementAnAncestor(elementId, item.childRef, props);
  });
};

/**
 * To prevent conflicts with hover actions we must
 * filter out any hover actions that are marked as added or removed
 */
export const filterInvalidHoverActions = (
  actions: cd.ActionBehavior[],
  elemIdsForActions: string[],
  availableHoverElements: Set<string>,
  instanceId?: string
): cd.ActionBehavior[] => {
  return actions.filter((action, idx) => {
    if (action.trigger !== cd.EventTrigger.Hover) return true;
    const elemId = elemIdsForActions[idx];
    const uniqueId = generateHoverId(elemId, instanceId);
    return availableHoverElements.has(uniqueId);
  });
};

/**
 * Returns a list of elementIds that have been added or removed.
 * This fixes an issue where a user might hover over a child inside
 * a hovered element which may unintentually call a mouseLeave event...
 *
 * The following accounts for the following considerations:
 * 1. We're using a single event listener on the page
 * 2. We look at an element's parent if we cant find actions
 * 3. We have to also look at Symbol Instances & Portals
 */
export const getHoverState = (
  type: cd.EventTriggerType,
  elemIdsForActions: string[],
  hoveringElements: Set<string>,
  elementId: string,
  instanceId?: string
): Set<string> => {
  const didEnter = type === cd.EventTrigger.MouseEnter;
  const didLeave = type === cd.EventTrigger.MouseLeave;
  const availableHoverElements = new Set<string>();

  if (didEnter || didLeave) {
    const uniqueBaseId = generateHoverId(elementId, instanceId);
    for (const elemId of elemIdsForActions) {
      const uniqueId = generateHoverId(elemId, instanceId);
      if (didEnter && !hoveringElements.has(uniqueId)) {
        hoveringElements.add(uniqueId);
        availableHoverElements.add(uniqueId);
      } else if (
        didLeave &&
        hoveringElements.has(uniqueId) &&
        (uniqueBaseId === uniqueId || elementId === instanceId)
      ) {
        hoveringElements.delete(uniqueId);
        availableHoverElements.add(uniqueId);
      }
    }
  }

  return availableHoverElements;
};

export const generateHoverId = (elementId: string, instanceId?: string): string => {
  return `${elementId}${instanceId ?? ''}`;
};

/**
 * Recursive lookup the id for actions on the element or parent.
 * TODO: consolidate with actionsForTrigger
 */
export const elementIdsForActions = (
  elementId: string,
  props: cd.ElementPropertiesMap,
  actions: cd.ActionBehavior[] = [],
  fallback?: string
): string[] => {
  const element = props[elementId];
  const elementActions = element?.actions || [];
  const parentId = element?.parentId;
  const elementActionIds = elementActions.map((action) => action.id);
  return actions.flatMap((action) => {
    const actionId = action.id;
    if (elementActionIds.includes(actionId)) return elementId;
    if (parentId) return elementIdsForActions(parentId, props, actions, elementId);
    return fallback || elementId;
  });
};

const sendRunJSErrorToast = (err: Error) => {
  console.warn(err);
  const message = 'Unable to execute Run JS function, check the console for error details';
  const toast = { id: 'toast', iconName: 'warning', message };
  messagingService.postMessageToParent(new PostMessageToast(toast));
};

export const executeJSAction = (
  action: cd.IActionBehaviorRunJS,
  outletDocument: HTMLDocument,
  elementId: string,
  _instanceId?: string
) => {
  const targetId = action.target || elementId; // target || self
  if (!targetId || action.value === undefined) return;
  const target = selectDOMElementWithTemplateId(targetId, outletDocument);
  const self = selectDOMElementWithTemplateId(elementId, outletDocument);
  const win = outletDocument.defaultView as any;
  try {
    const func = new win.Function('target', 'self', 'document', 'window', action.value);
    func(target, self, outletDocument, win);
  } catch (err) {
    sendRunJSErrorToast(err);
  }
};

const sendResetActionToApp = (id: string | undefined, children: boolean): void => {
  if (!id) return;

  // If the reset target is a board portal
  // we can assume the user wants to reset the portal's board
  const element = rendererState.getElementById(id);
  if (children && mUtils.isBoardPortal(element)) {
    const refId = element?.inputs?.referenceId;
    if (refId) sendResetActionToApp(refId, true);
  }

  const msg = new PostMessageResetElementState(id, children);
  messagingService.postMessageToParent(msg);
};

const sendResetEntireState = () => {
  messagingService.postMessageToParent(new PostMessageResetAll());
};

export const resetStateAction = (
  action: cd.IActionBehaviorResetState,
  elementId: string,
  _instanceId?: string
) => {
  const element = rendererState.getElementById(elementId);
  if (!element) return;
  // prettier-ignore
  switch (action.mode) {
    case cd.ActionResetMode.All: return sendResetEntireState();
    case cd.ActionResetMode.CurrentBoard: return sendResetActionToApp(element?.rootId, true);
    case cd.ActionResetMode.Element: return sendResetActionToApp(action?.target, action?.targetChildren ?? false);
  }
};

export const scrollToAction = (
  action: cd.IActionBehaviorScrollTo,
  _elementId: string,
  _instanceId: string | undefined,
  outletDocument: Document
) => {
  const { target, mode, animate, block, inline } = action;
  if (!target) return;
  const targetElem = selectDOMElementWithTemplateId(target, outletDocument);
  const behavior: ScrollBehavior | undefined = animate ? ScrollBehavior.Smooth : undefined;

  if (!targetElem) return;
  switch (mode) {
    case cd.ActionScrollMode.Element: {
      targetElem.scrollIntoView({ behavior, block, inline });
      break;
    }
    case cd.ActionScrollMode.Bottom:
    case cd.ActionScrollMode.Top: {
      const top = mode === cd.ActionScrollMode.Bottom ? targetElem.scrollHeight : 0;
      targetElem.scrollTo({ top, behavior });
      break;
    }
    case cd.ActionScrollMode.Left:
    case cd.ActionScrollMode.Right: {
      const left = mode === cd.ActionScrollMode.Right ? targetElem.scrollWidth : 0;
      targetElem.scrollTo({ left, behavior });
      break;
    }
  }
};
