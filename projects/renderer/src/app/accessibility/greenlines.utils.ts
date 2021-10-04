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

import { ariaTagRoles } from 'cd-metadata/aria';
import * as consts from 'cd-common/consts';
import * as cd from 'cd-interfaces';
import * as utils from 'cd-common/utils';
import * as queryUtils from '../utils/query.utils';
import { generateIDWithLength } from 'cd-utils/guid';

/** Get render results for all greenlines types for current board state */
export const getGreenlineRenderResults = (
  board: HTMLDocument | HTMLElement,
  rootId: string
): cd.IGreenlineRenderResults => {
  const allA11yElements = queryUtils.queryAllA11yElements(board);

  const focusRects = getFocusGroupGreenlines(allA11yElements, rootId);
  const tabRects = getFlowGreenlines(allA11yElements, rootId);
  const landmarkRects = getLandmarkGreenlines(allA11yElements, rootId);
  const headingRects = getHeadingGreenlines(allA11yElements, rootId);
  const flowRects = [...focusRects, ...tabRects];
  const boardHasGreenlineResults = flowRects.length || landmarkRects.length || headingRects;
  const masks = boardHasGreenlineResults ? getOverlayMaskRects(board, rootId) : [];
  return { flow: flowRects, landmarks: landmarkRects, headings: headingRects, masks };
};

/** Get flow (tab) based greenlines from a list of elements */
const getFlowGreenlines = (
  elements: HTMLElement[],
  rootId: string
): cd.IGreenlineRenderResult[] => {
  const tabbableElements = elements.filter(queryUtils.elementIsTabbable);
  const sortedTabbableElements = queryUtils.sortElementsByTabIndex(tabbableElements);
  return getAdjustedFlowRects(sortedTabbableElements, rootId);
};

/**
 * Adjust tab flow results to skip false positives or have better element rects,
 * based on default HTML patterns or third party components with special edge cases.
 * */
const getAdjustedFlowRects = (
  tabbableElements: ReadonlyArray<HTMLElement>,
  rootId: string
): cd.IGreenlineRenderResult[] => {
  const radioTabStopMap = generateRadioTabStopMap(tabbableElements);
  const greenlineRectResults: cd.IGreenlineRenderResult[] = [];

  let flowOrderTracker = 0;
  let overlayOrderTracker = 0;
  for (const element of tabbableElements) {
    const shouldSkipElement =
      shouldFlowElementBeSkipped(element) || shouldRadioElementBeSkipped(element, radioTabStopMap);
    if (shouldSkipElement) continue;

    // Run relevant Material adjustments
    const elementDidAdjustForMatInputs = getAdjustedMatToggleElement(element);
    const elementDidAdjustForChips = getAdjustedChipElement(element);

    // Determine which element to grab rect from, and which to grab data from
    const rectElement = elementDidAdjustForMatInputs || elementDidAdjustForChips || element;
    const infoElement = elementDidAdjustForChips ? rectElement : element;
    const elementA11yInfo = getElementDOMData(infoElement);

    // If overlay is present, greenlines not inside overlays need to be masked.
    const elementIsInOverlay = getElementIsOverlayChild(element);
    if (elementIsInOverlay) overlayOrderTracker++;
    else flowOrderTracker++;
    const order = elementIsInOverlay ? overlayOrderTracker : flowOrderTracker;

    const rect = generateGreenlineRect(
      rectElement,
      rootId,
      cd.GreenlineType.Flow,
      !elementIsInOverlay,
      elementA11yInfo,
      '',
      order
    );

    greenlineRectResults.push(rect);
  }

  return greenlineRectResults;
};

/**
  Get focus group based greenlines from a list of elements.
  Adjust focus group results to have better element rects, 
  or adjust third party components with special edge cases 
*/
const getFocusGroupGreenlines = (
  elements: HTMLElement[],
  rootId: string
): cd.IGreenlineRenderResult[] => {
  const focusGroupElements = elements.filter(queryUtils.elementIsFocusGroup);
  const greenlineRectResults: cd.IGreenlineRenderResult[] = [];

  for (const element of focusGroupElements) {
    const elementDidAdjustForStepper = getAdjustedStepperHeaderGroup(element);
    const elementDidAdjustForMatInputs = getAdjustedMatToggleElement(element);
    const rectElement = elementDidAdjustForStepper || elementDidAdjustForMatInputs || element;
    const elementA11yInfo = getElementDOMData(element);
    const useMask = !getElementIsOverlayChild(element);
    const type = getElementTabType(element);

    const focusRect = generateGreenlineRect(rectElement, rootId, type, useMask, elementA11yInfo);
    greenlineRectResults.push(focusRect);
  }

  return greenlineRectResults;
};

/** Get landmark based greenlines from a list of elements */
const getLandmarkGreenlines = (
  elements: HTMLElement[],
  rootId: string
): cd.IGreenlineRenderResult[] => {
  const landmarkElements = elements.filter(queryUtils.elementIsLandmark);

  return landmarkElements.map((element: HTMLElement) => {
    const userDefinedRole = element.getAttribute(consts.ARIA_ROLE_ATTR);
    const label = userDefinedRole ? userDefinedRole : ariaTagRoles[element.tagName.toLowerCase()];
    const useMask = !getElementIsOverlayChild(element);
    const elementA11yInfo = getElementDOMData(element);

    return generateGreenlineRect(
      element,
      rootId,
      cd.GreenlineType.Landmark,
      useMask,
      elementA11yInfo,
      label
    );
  });
};

/** Get heading based greenlines from a list of elements */
const getHeadingGreenlines = (
  elements: HTMLElement[],
  rootId: string
): cd.IGreenlineRenderResult[] => {
  const headingElements = elements.filter(queryUtils.elementIsHeading);

  return headingElements.map((element: HTMLElement) => {
    const level = utils.getAriaLevelFromHeadingElement(element);
    const tag = element.tagName.toLowerCase();
    const label = consts.HEADING_TAGS.includes(tag) ? `<${tag}>` : `<h${level}>`;
    const useMask = !getElementIsOverlayChild(element);
    const elementA11yInfo = getElementDOMData(element);
    return generateGreenlineRect(
      element,
      rootId,
      cd.GreenlineType.Heading,
      useMask,
      elementA11yInfo,
      label
    );
  });
};

const getOverlayMaskRects = (
  board: HTMLDocument | HTMLElement,
  rootId: string
): cd.IGreenlineRenderResult[] => {
  const queryElement = board.parentNode || board;
  const overlaySelectorString = queryUtils.getSelectorString(consts.OVERLAY_SELECTORS);
  const overlayContainers = queryElement.querySelectorAll(overlaySelectorString);
  if (!overlayContainers.length) return [];
  return Array.from(overlayContainers).map((overlay: Element) =>
    generateGreenlineRect(overlay as HTMLElement, rootId, cd.GreenlineType.Mask)
  );
};

/** Generate element greenline rect to render on the board */
const generateGreenlineRect = (
  element: HTMLElement,
  rootId: string,
  type = cd.GreenlineType.Flow,
  useMask?: boolean,
  info?: cd.IElementA11yInfo,
  label?: string,
  order?: number
): cd.IGreenlineRenderResult => {
  // Use element id if top level component, or generate a new temp id for children
  const id = queryUtils.getElementDataId(element) || generateIDWithLength(20);
  // Finds closest parent element for children of top level components
  const elementId = queryUtils.closestElementId(element);
  const frame = utils.frameForElement(element);
  const rect = { id: elementId, rootId, frame };
  return { id, elementId, rect, type, order, label, useMask, info };
};

const getElementIsOverlayChild = (element: HTMLElement) => {
  const overlaySelectorString = queryUtils.getSelectorString(consts.OVERLAY_SELECTORS);
  return !!element.closest(overlaySelectorString);
};

/**
 * Get rect for the currently focused item on the board.
 * Needs same container adjustments as greenlines so element rects line up.
 */
export const getActiveFocusElementRect = (element: HTMLElement, rootId: string) => {
  // Run relevant Material adjustments
  const elementDidAdjustForMatInputs = getAdjustedMatToggleElement(element);
  const adjustedElement = elementDidAdjustForMatInputs || element;
  return generateGreenlineRect(adjustedElement, rootId, cd.GreenlineType.Focus);
};

/**
 * Checks if greenline type should be flow or focus depending on the selector
 */
const getElementTabType = (element: HTMLElement) => {
  const elementIsFocusChild = queryUtils.elementIsFocusGroupChild(element);
  return elementIsFocusChild ? cd.GreenlineType.GroupChild : cd.GreenlineType.Flow;
};

/**
 * Checks element for several conditions for whether
 * it should be skipped as a flow greenline.
 */
const shouldFlowElementBeSkipped = (element: HTMLElement) => {
  // Elements to manually exclude with no other conditions
  const skipSelectors = [
    consts.CDK_FOCUS_ANCHOR,
    consts.MAT_MENU_ITEM_CLASS,
    consts.MAT_OPTION_CLASS,
  ];
  if (element.matches(queryUtils.getSelectorString(skipSelectors))) {
    return true;
  }

  return false;
};

/**
 * Checks if element is a semantic radio.
 * If so, decides whether the radio should be skipped as a greenline
 * depending on whether it is the correct focus stop of the radio group.
 */
const shouldRadioElementBeSkipped = (
  element: HTMLElement,
  radioTabStopMap: Map<string, HTMLElement>
) => {
  // Semantic HTML radios
  if (element.matches(consts.RADIO_INPUT)) {
    const radioName = element.getAttribute(consts.NAME_ATTR);
    const focusStopRadio = radioName && radioTabStopMap.get(radioName);
    // Radio should be skipped if its not the correct focus stop
    return element !== focusStopRadio;
  }

  return false;
};

/**
 * Check for Material radios/checkbox/toggles.
 * If so, returns larger label rect to replace tiny input rect.
 * */
const getAdjustedMatToggleElement = (element: HTMLElement) => {
  const matToggleElements = [
    consts.MAT_RADIO_INPUT_CLASS,
    consts.MAT_CHECKBOX_INPUT_CLASS,
    consts.MAT_TOGGLE_INPUT_CLASS,
  ];
  if (!element.matches(queryUtils.getSelectorString(matToggleElements))) return null;
  return (element.parentNode as HTMLElement) || element;
};

/**
 * Checks if element is Material chip list or grid container.
 * If so, finds initial focus chip for the group.
 * */
const getAdjustedChipElement = (element: HTMLElement) => {
  const matGridContainers = [consts.MAT_CHIP_LIST_CLASS, consts.MAT_CHIP_GRID_TAG];
  if (!element.matches(queryUtils.getSelectorString(matGridContainers))) return null;
  // NOTE: Mat chip tab stops do not default to selected chip like radios do,
  // this could be an a11y bug that gets fixed eventually so we should keep an eye on it.
  const chipSelectors = [consts.MAT_CHIP_ENABLED_SELECTOR, consts.MAT_CHIP_ROW_TAG];
  const firstChip = element.querySelector(
    queryUtils.getSelectorString(chipSelectors)
  ) as HTMLElement;
  return firstChip || element;
};

/**
 * Checks if element is Material stepper header.
 * If so, returns better focus container for group.
 * */
const getAdjustedStepperHeaderGroup = (element: HTMLElement) => {
  if (!element.matches(consts.MAT_STEPPER_HZ_CLASS)) return null;
  const stepperHeader = element.querySelector(consts.MAT_STEPPER_HZ_HEADER_CLASS) as HTMLElement;
  return stepperHeader || element;
};

/**
 * Searches all semantic radios in a list of elements,
 * and returns a map of the current radio tab stop per radio group.
 * */
const generateRadioTabStopMap = (elements: ReadonlyArray<HTMLElement>) => {
  const radioGroupMap = new Map();
  for (const ele of elements) {
    if (!ele.matches(consts.RADIO_INPUT)) continue;

    const name = ele.getAttribute(consts.NAME_ATTR);
    const activeRadioIsSet = radioGroupMap.get(name);
    const isCheckedRadio = ele.matches(consts.RADIO_INPUT_CHECKED);
    // First radio of group is added as initial tab stop, or is overridden with checked radio
    if (!activeRadioIsSet || isCheckedRadio) {
      radioGroupMap.set(name, ele);
    }
  }
  return radioGroupMap;
};

/** Get relevant a11y attributes directly from element DOM for annotations */
const getElementDOMData = (element: HTMLElement): cd.IElementA11yInfo => {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute(consts.ARIA_ROLE_ATTR);
  const aria = [];

  if (role) aria.push({ name: consts.ARIA_ROLE_ATTR, value: role });

  const attributesList = Array.from(element.attributes);
  for (const attr of attributesList) {
    const { name, value } = attr;
    const attrIsAria = name.startsWith(consts.ARIA_ATTR_PREFIX);
    if (attrIsAria) {
      aria.push({ name, value });
    }
  }

  return { tag, aria };
};
