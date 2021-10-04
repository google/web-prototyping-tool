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

import { getAttributeDataIdFromElement, wrapInBrackets } from 'cd-common/models';
import { filter, map, distinctUntilChanged } from 'rxjs/operators';
import {
  TEMPLATE_ID_ATTR,
  PREVENT_CLICK_ACTIONS_ATTR,
  TEMPLATE_INSTANCE_ATTR,
  OVERLAY_INSTANCE_INDEX,
} from 'cd-common/consts';
import { fromEvent, merge, Observable } from 'rxjs';
import * as cd from 'cd-interfaces';

export interface IMouseEventCapture {
  elementId: string;
  evt: MouseEvent;
  childOf?: boolean;
}

/** Some components may dispatch a mouse event, this filters out duplicates */
export const didElementIdAndMouseEventChange = (
  x: IMouseEventCapture,
  y: IMouseEventCapture
): boolean => {
  const areIdsEqual = x.elementId === y.elementId;
  const xType = x.evt.type;
  const yType = y.evt.type;
  const areTypesEqual = xType === yType;
  const areTypesClick = xType === cd.EventTrigger.Click && yType === cd.EventTrigger.Click;
  return areIdsEqual && areTypesEqual && !areTypesClick;
};

export const createActionMouseEvents = (doc: HTMLDocument): Observable<IMouseEventCapture> => {
  const captureConfig = { capture: true };
  return merge(
    fromEvent<MouseEvent>(doc, cd.EventTrigger.Click, captureConfig),
    fromEvent<MouseEvent>(doc, cd.EventTrigger.DoubleClick, captureConfig),
    fromEvent<MouseEvent>(doc, cd.EventTrigger.MouseUp, captureConfig),
    fromEvent<MouseEvent>(doc, cd.EventTrigger.MouseDown, captureConfig),
    fromEvent<MouseEvent>(doc, cd.EventTrigger.MouseLeave, captureConfig),
    fromEvent<MouseEvent>(doc, cd.EventTrigger.MouseEnter, captureConfig)
  ).pipe(
    filter(({ target }) => (target as HTMLElement).closest !== undefined),
    filter(preventClickActionsForSplitButtonArrowFilter),
    map<MouseEvent, IMouseEventCapture>((evt) => {
      const target = evt.target as HTMLElement;
      const closest = closestTargetForAttr(target, TEMPLATE_ID_ATTR);
      const childOf = elementContains(closest, evt.relatedTarget);
      const elementId = closest && getAttributeDataIdFromElement(closest);
      return { elementId, evt, childOf };
    }),
    // Ignore elements without an elementId
    filter((item) => !!item.elementId && !item.childOf),
    // Some components may dispatch a mouse event, this filters out duplicates
    distinctUntilChanged(didElementIdAndMouseEventChange)
  );
};

export const elementContains = (
  elem: HTMLElement | undefined,
  relatedTarget: EventTarget | null
): boolean => {
  if (!elem || !relatedTarget) return false;
  return elem.contains(relatedTarget as HTMLElement);
};

export const closestTargetForAttr = (target: HTMLElement, attr: string): HTMLElement => {
  const attributeSelector = wrapInBrackets(attr);
  return target.closest(attributeSelector) as HTMLElement;
};

export const getClosestOverlayInstanceId = (target?: HTMLElement): string | undefined => {
  if (!target) return;
  const overlayIdSelector = wrapInBrackets(OVERLAY_INSTANCE_INDEX);
  const closestOverlay = target.closest(overlayIdSelector) as HTMLElement;
  return closestOverlay?.dataset.overlayIdx;
};

export const getClosestInstances = (
  target: HTMLElement
): [
  instanceId: string | undefined,
  parentInstanceId: string | undefined,
  overlayInstanceIdx: string | undefined
] => {
  const selector = wrapInBrackets(TEMPLATE_INSTANCE_ATTR);
  const closestInstance = target.closest(selector) as HTMLElement;
  const instanceId = closestInstance && getAttributeDataIdFromElement(closestInstance);
  // Looking up the parent is used to identify actions on symbol instances within a portal
  // in the future this could be used to update a Tab's portal
  const parentInstance = closestInstance?.parentElement?.closest(selector) as HTMLElement;
  const parentInstanceId = parentInstance && getAttributeDataIdFromElement(parentInstance);
  const overlayInstanceIdx = getClosestOverlayInstanceId(target);
  return [instanceId, parentInstanceId, overlayInstanceIdx];
};

/**
 * Prevent click interaction from firing if attribute is set on event target.
 * Used by split button to prevent menu trigger from also firing the main button action. */
const preventClickActionsForSplitButtonArrowFilter = (e: any) => {
  const typeIsClick = e.type === cd.EventTrigger.Click;
  if (!typeIsClick) return true;

  const preventClickSelector = wrapInBrackets(PREVENT_CLICK_ACTIONS_ATTR);
  const hasSelector = e.target.closest(preventClickSelector) !== null;
  return hasSelector === false;
};
