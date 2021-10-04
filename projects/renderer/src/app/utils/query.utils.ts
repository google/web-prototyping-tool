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

import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ariaFocusGroupRoles } from 'cd-metadata/aria';
import * as consts from 'cd-common/consts';

/**
 * Query all elements that have a11y related properties.
 * Returns flattened element list in original order, including shadow dom.
 */
export const queryAllA11yElements = (context: HTMLDocument | HTMLElement) => {
  const allA11ySelectors = getSelectorString([
    getTabbableSelectors(),
    getFocusGroupParentSelectors(),
    getFocusGroupChildSelectors(),
    getLandmarkSelectors(),
    getHeadingSelectors(),
  ]);

  const selector = `${allA11ySelectors}, ${consts.SHADOW_ROOT_SELECTOR}`;
  const initialElements = queryVisibleElements(context, selector);
  return getShadowElements(initialElements, allA11ySelectors);
};

/** Get flattened list of DOM elements with sorted shadow content matching query */
const getShadowElements = (elements: HTMLElement[], query: string) => {
  const allNestedShadowElementResults: HTMLElement[] = [];

  for (const topLevelElement of elements) {
    // Skip/remove any orphaned shadow component slot content
    // caught in the original query (is a duplicate and in incorrect order)
    if (elementIsChildOfShadowRootComponent(topLevelElement)) continue;

    // Keep any non-shadow elements as-is
    if (!elementHasShadowRoot(topLevelElement)) {
      allNestedShadowElementResults.push(topLevelElement as HTMLElement);
      continue;
    }

    // If element has shadow root, query shadow content
    const shadowElementsWithSlotContent = queryElementShadowRoot(topLevelElement, query);
    allNestedShadowElementResults.push(...shadowElementsWithSlotContent);
  }

  return allNestedShadowElementResults;
};

/** Query element's shadow root, sorting content into any existing slots while maintaining DOM order */
export const queryElementShadowRoot = (element: HTMLElement, query: string) => {
  const shadowContentQuery = getSelectorString([query, consts.SLOT]);
  const shadowElements = element.shadowRoot?.querySelectorAll(shadowContentQuery) || [];
  const shadowElementsWithSlotContent: HTMLElement[] = [];

  // Container element can also have a query match
  if (element.matches(query)) {
    shadowElementsWithSlotContent.push(element);
  }

  for (let i = 0; i < shadowElements.length; i++) {
    const isSlot = shadowElements[i] instanceof HTMLSlotElement;

    // Add non-slotted elements with no further modifications
    if (!isSlot && !elementIsHidden(shadowElements[i])) {
      shadowElementsWithSlotContent.push(shadowElements[i] as HTMLElement);
      continue;
    }

    // If named slot container: find matching assigned slot content
    // If unnamed slot container: gather all remaining unassigned elements
    const slotName = shadowElements[i].getAttribute(consts.NAME_ATTR);
    const selector = slotName
      ? attributeSelector(consts.SLOT, slotName)
      : getDirectChildrenExcludeSelector(`[${consts.SLOT}]`);

    const slotContent = element.querySelectorAll(selector);
    // Skip/discard entire slot if no content found
    if (!slotContent || !slotContent.length) continue;

    const slotContentElements = queryNestedElements(slotContent, query);
    shadowElementsWithSlotContent.push(...slotContentElements);
  }
  return shadowElementsWithSlotContent;
};

/** 
 Perform a query on Element nodes list and returns a flattened array 
 of all nested results in initial DOM order 
 */
export const queryNestedElements = (elements: NodeListOf<Element>, query: string) => {
  const allNestedElementsResults: HTMLElement[] = [];

  for (let i = 0; i < elements.length; i++) {
    // Include container element if also matches query
    if (elements[i].matches(query) && !elementIsHidden(elements[i]))
      allNestedElementsResults.push(elements[i] as HTMLElement);
    const elementContents = queryVisibleElements(elements[i], query);
    allNestedElementsResults.push(...elementContents);
  }
  return allNestedElementsResults;
};

/** Query and return all tabbable elements in provided element context, in order by tabindex */
export const queryTabbableElements = (
  context: HTMLDocument | Element,
  includeContext = false
): HTMLElement[] => {
  // Add shadow root components to query to preserve positions when pulling shadow content later
  const tabQuery = getSelectorString([getTabbableSelectors(), consts.SHADOW_ROOT_SELECTOR]);
  const initialElements = queryVisibleElements(context, tabQuery);
  const contextElement = context as HTMLElement;
  const canUseTabbableContext = includeContext && elementIsTabbable(contextElement);
  const tabbableElementsContext = canUseTabbableContext ? [contextElement] : [];

  const allElements = getShadowElements(initialElements, tabQuery);
  if (!allElements) return tabbableElementsContext;

  const tabbableElements = Array.from(allElements).filter(elementStateIsTabbable) as HTMLElement[];

  return [...tabbableElementsContext, ...sortElementsByTabIndex(tabbableElements)];
};

/**
  Sort elements by tabindex according to spec: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
*/
export const sortElementsByTabIndex = (elements: HTMLElement[]): HTMLElement[] => {
  const sortedElements = [...elements];
  sortedElements.sort((ele1, ele2) => {
    // Maintain current order if the same,
    // otherwise always sort 0 to the end.
    if (ele1.tabIndex === ele2.tabIndex) return 0;
    if (ele1.tabIndex <= 0) return 1;
    if (ele2.tabIndex <= 0) return -1;

    // Any non-zero elements should be in asc order
    return ele1.tabIndex - ele2.tabIndex;
  });

  return sortedElements;
};

export const getInitialTabbableElement = (
  context: HTMLDocument | HTMLElement,
  includeContext = false
): HTMLElement | undefined => {
  const tabbable = queryTabbableElements(context, includeContext);
  return tabbable.length ? tabbable[0] : undefined;
};

export const queryAndSetInitialFocus = (
  context: HTMLDocument | HTMLElement,
  initialFocusElementId?: string
) => {
  const initialFocusElement =
    initialFocusElementId && queryElementByDataId(context, initialFocusElementId);
  const firstElementInContext = getInitialTabbableElement(context);

  const focusTargetElement = initialFocusElement || firstElementInContext;

  // If query couldn't find a focus target, focus will remain wherever it was
  if (focusTargetElement) focusTargetElement.focus();
};

/** Generic element query that accepts any selector and filters by element visibility */
export const queryVisibleElements = (
  context: HTMLDocument | HTMLElement | Element,
  selector: string
) => {
  const elements = context.querySelectorAll(selector);
  return Array.from(elements).filter((element) => !elementIsHidden(element)) as HTMLElement[];
};

export const queryElementByDataId = (
  element: HTMLDocument | HTMLElement,
  elementId: string
): HTMLElement | undefined => {
  const selector = attributeSelector(consts.TEMPLATE_ID_ATTR, elementId);
  return element.querySelector(selector) as HTMLElement;
};

/** Check if element is hidden from view via display or visibility. */
const elementIsHidden = (element: HTMLElement | Element): boolean => {
  // Simple cheat to check if element or ancestor is hidden via display: none
  const elementOffsetParent = (element as HTMLElement).offsetParent;
  if (!elementOffsetParent) return true;

  // Computed visibility will check if current element or ancestor is hidden
  if (!window) return false;
  const visibility = window.getComputedStyle(element).visibility;
  const { CSS_VISIBILITY_HIDDEN, CSS_VISIBILITY_COLLAPSED } = consts;
  return visibility === CSS_VISIBILITY_HIDDEN || visibility === CSS_VISIBILITY_COLLAPSED;
};

/** Determine if element should be unreachable via its tabindex */
const elementIsHiddenByTabIndex = (element: HTMLElement) => {
  // Use computed tabindex if not a special element
  const tagName = element.tagName.toLowerCase();
  const elementCanHaveNegativeTabindex = consts.NEGATIVE_TABINDEX_ELEMENTS.includes(tagName);
  if (!elementCanHaveNegativeTabindex) return element.tabIndex <= -1;

  // Use tabindex attr if set
  const userDefinedTabindex = element.getAttribute(consts.TABINDEX_ATTR);
  if (userDefinedTabindex === null) return false;
  const tabIndexAsNumber = parseInt(userDefinedTabindex, 10);
  return tabIndexAsNumber <= -1;
};

/** Check if element is currently reachable via tab key */
export const elementIsTabbable = (element: HTMLElement | Element): boolean => {
  const tabbableSelectors = getSelectorString(consts.CORE_FOCUS_SELECTORS);
  const elementIsTabbableSelector = element.matches(tabbableSelectors);
  if (!elementIsTabbableSelector) return false;

  return elementStateIsTabbable(element as HTMLElement);
};

const elementStateIsTabbable = (element: HTMLElement) => {
  const tagName = element.tagName.toLowerCase();
  const disabledAttr = element.getAttribute(consts.DISABLED_ATTR);
  const elementCanBeDisabled = consts.DISABLEABLE_FOCUS_TAGS.includes(tagName);
  const elementHasDisabledAttr = coerceBooleanProperty(disabledAttr) === true;
  const elementIsDisabled = elementCanBeDisabled && elementHasDisabledAttr;
  return !elementIsDisabled && !elementIsHiddenByTabIndex(element);
};

export const elementIsLandmark = (element: HTMLElement): boolean => {
  const roleAttr = element.getAttribute(consts.ARIA_ROLE_ATTR) || '';
  const tagName = element.tagName.toLowerCase();
  const elementHasLandmarkRole = consts.LANDMARK_ROLES.includes(roleAttr);
  const elementHasLandmarkTag = consts.LANDMARK_TAGS.includes(tagName);
  return elementHasLandmarkRole || elementHasLandmarkTag;
};

export const elementIsHeading = (element: HTMLElement): boolean => {
  const roleAttr = element.getAttribute(consts.ARIA_ROLE_ATTR) || '';
  const tagName = element.tagName.toLowerCase();
  const elementHasHeadingRole = roleAttr === consts.HEADING_ROLE;
  const elementHasHeadingTag = consts.HEADING_TAGS.includes(tagName);
  return elementHasHeadingRole || elementHasHeadingTag;
};

export const elementIsFocusGroupParent = (element: HTMLElement) => {
  const focusGroupParentSelectors = getFocusGroupParentSelectors();
  return element.matches(focusGroupParentSelectors);
};

export const elementIsFocusGroupChild = (element: HTMLElement) => {
  const focusGroupChildSelectors = getFocusGroupChildSelectors();
  return element.matches(focusGroupChildSelectors);
};

export const elementIsFocusGroup = (element: HTMLElement) => {
  const focusGroupSelectors = getSelectorString([
    getFocusGroupParentSelectors(),
    getFocusGroupChildSelectors(),
  ]);
  return element.matches(focusGroupSelectors);
};

export const elementIsFirstOfType = (element: HTMLElement) => {
  const firstOfTypeTagSelector = `${element?.tagName}${consts.FIRST_TYPE_SELECTOR}`;
  return element?.matches(firstOfTypeTagSelector);
};

export const elementHasShadowRoot = (element: HTMLElement) => {
  return element.classList.contains(consts.SHADOW_ROOT_CLASS);
};

export const elementIsChildOfShadowRootComponent = (element: HTMLElement) => {
  return element.matches(consts.SHADOW_CHILD_SELECTOR);
};

export const getSelectorString = (selectors: string[]) => selectors.join(', ');

export const attributeSelector = (attr: string, value: string) => `[${attr}="${value}"]`;

export const excludeSelector = (selector: string) => `${consts.NOT_SELECTOR}(${selector})`;

export const getExcludeDisabledSelector = () => {
  const disabledAriaAttr = attributeSelector(consts.ARIA_DISABLED_ATTR, 'true');
  const disabledAttrSelector = `:${consts.DISABLED_ATTR}`;
  return `${excludeSelector(disabledAttrSelector)}${excludeSelector(disabledAriaAttr)}`;
};

export const getDirectChildrenExcludeSelector = (selector: string) => {
  return `${consts.SCOPE_SELECTOR} > *${excludeSelector(selector)}`;
};

export const getTabbableSelectors = () => {
  return getSelectorString(consts.CORE_FOCUS_SELECTORS);
};

export const getFocusGroupParentSelectors = () => {
  const mapSelectors = Object.values(ariaFocusGroupRoles).flatMap((group) => group.parents);
  return getSelectorString(mapSelectors);
};

export const getFocusGroupChildSelectors = () => {
  const mapSelectors = Object.values(ariaFocusGroupRoles).flatMap((group) => {
    return group.parents.flatMap((p) => {
      return group.children.map((c: string) => `${p} ${c}${getExcludeDisabledSelector()}`);
    });
  });
  // (Include bespoke additions for 3rd party components that don't follow ARIA conventions.)
  return getSelectorString([...mapSelectors]);
};

export const getLandmarkSelectors = () => {
  const landmarkRoleSelectors = consts.LANDMARK_ROLES.map((role: string) => {
    return attributeSelector(consts.ARIA_ROLE_ATTR, role);
  });
  const landmarkSelectorList = [...landmarkRoleSelectors, ...consts.LANDMARK_TAGS];
  return getSelectorString(landmarkSelectorList);
};

export const getHeadingSelectors = () => {
  const roleSelector = attributeSelector(consts.ARIA_ROLE_ATTR, consts.HEADING_ROLE);
  const headingSelectorList = [...consts.HEADING_TAGS, roleSelector];
  return getSelectorString(headingSelectorList);
};

export const getElementDataId = (element: HTMLElement) => {
  return element.dataset?.id || '';
};

/** Find closest prop model element (has a data-id) */
export const closestElementId = (element: HTMLElement): string => {
  const id = getElementDataId(element);
  if (id) return id;

  const parent = element.parentElement;
  if (parent) return closestElementId(parent);
  // Upon reaching top level and not finding a data-id,
  // check if element is in shadowdom and get the host element
  const elementShadowHost = (element.getRootNode() as ShadowRoot).host;
  return elementShadowHost ? closestElementId(elementShadowHost as HTMLElement) : '';
};
