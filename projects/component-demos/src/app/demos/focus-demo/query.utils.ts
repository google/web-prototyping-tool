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
import * as consts from 'cd-common/consts';

/** Query and return all tabbable elements in provided element context, in order by tabindex */
export const queryTabbableElements = (
  element: HTMLDocument | Element,
  includeContext = false
): HTMLElement[] => {
  const selector = getSelectorString(consts.CORE_FOCUS_SELECTORS);
  const elements = element.querySelectorAll(selector);

  const contextElement = element as HTMLElement;
  const canUseTabbableContext =
    includeContext && contextElement.matches(selector) && elementIsTabbable(contextElement);

  const tabbableElementsContext = canUseTabbableContext ? [contextElement] : [];
  if (!elements) return tabbableElementsContext;

  const tabbableElements = Array.from(elements).filter(elementIsTabbable) as HTMLElement[];

  return [...tabbableElementsContext, ...sortElementsByTabIndex(tabbableElements)];
};

/** Check if element is currently reachable via tab key */
const elementIsTabbable = (element: HTMLElement | Element): boolean => {
  const htmlElement = element as HTMLElement;

  const tagName = htmlElement.tagName.toLowerCase();
  const elementCanBeDisabled = consts.DISABLEABLE_FOCUS_TAGS.includes(tagName);
  const elementHasDisabledAttr =
    coerceBooleanProperty(htmlElement.getAttribute(consts.DISABLED_ATTR)) === true;
  const elementIsDisabled = elementCanBeDisabled && elementHasDisabledAttr;

  if (elementIsDisabled || elementIsHiddenByTabIndex(htmlElement) || elementIsHidden(htmlElement)) {
    return false;
  }

  // Check ancestry to catch anything not inherited by element
  return !elementHasHiddenAncestor(htmlElement);
};

/**
  Check if element has any mechanism that removes tabbability via display or visibility.
*/
const elementIsHidden = (element: HTMLElement | Element): boolean => {
  const computedStyles = window.getComputedStyle(element);
  return (
    computedStyles.display === consts.CSS_DISPLAY_NONE ||
    computedStyles.visibility === consts.CSS_VISIBILITY_HIDDEN ||
    computedStyles.visibility === consts.CSS_VISIBILITY_COLLAPSED
  );
};

/** Check if any ancestor of element is hidden */
const elementHasHiddenAncestor = (element: HTMLElement | Element): boolean => {
  const parent = element.parentElement;
  if (!parent) return false;
  if (elementIsHidden(parent)) return true;
  return elementHasHiddenAncestor(parent as HTMLElement);
};

const elementIsHiddenByTabIndex = (element: HTMLElement) => {
  // Some elements have native negative tabindex but are still tabbable via shadowdom, etc.
  // Since we ignore shadowdom, we want the element to reflect as tabbable anyway,
  // but only if the user hasn't set a negative tabindex manually.

  // Use computed tabindex if not a special element
  const tagName = element.tagName.toLowerCase();
  const elementCanHaveNegativeTabindex = consts.NEGATIVE_TABINDEX_ELEMENTS.includes(tagName);
  if (!elementCanHaveNegativeTabindex) return element.tabIndex <= -1;

  const userDefinedTabindex = element.getAttribute(consts.TABINDEX_ATTR);
  if (userDefinedTabindex === null) return false;

  // Use tabindex attr if set
  const tabIndexAsNumber = parseInt(userDefinedTabindex, 10);
  return tabIndexAsNumber <= -1;
};

/**
  Sort elements by tabindex according to spec: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
*/
const sortElementsByTabIndex = (elements: HTMLElement[]): HTMLElement[] => {
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

const getSelectorString = (selectors: string[]) => selectors.join(', ');
