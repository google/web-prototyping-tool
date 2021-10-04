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
import * as consts from 'cd-common/consts';
import {
  circularOutletGuard,
  ELEMENT_ID,
  TemplateFactory,
  wrapInBrackets,
  HAS_VALUE_PIPE,
} from './template.utils';
import { removeSpecialCharacters } from 'cd-utils/string';

export const CHILD_PORTALS_INPUT = 'childPortals';
const PORTAL_ZERO_STATE_MESSAGE_VAR = '--cd-portal-zero-state-message';
const CD_CHILD_PORTAL_CLASS = 'cd-child-content-portal';
const CD_PORTAL_ZERO_STATE_CLASS = 'cd-portal-zero-state';
const CD_PORTAL_ERROR_STATE_CLASS = 'cd-portal-error-state';

export const PORTAL_ERROR_TEMPLATE_REF = 'portalErrorRef';

const getSlotAttrNameValue = (
  slotName: string,
  addNgForIndexToSlotName = false
): [string, string] => {
  const attrName = addNgForIndexToSlotName ? wrapInBrackets(consts.SLOT) : consts.SLOT;
  const attrValue = addNgForIndexToSlotName ? `'${slotName}' + i` : slotName;
  return [attrName, attrValue];
};

export const generatePortal = (
  addNgForIndexToId: boolean = false,
  rootIdBinding: string,
  slotName?: string,
  addNgForIndexToSlotName = false
) => {
  const boardInstance = new TemplateFactory(cd.TemplateBuildMode.Internal, consts.CD_OUTLET_TAGNAME)
    .addBoundAttribute(consts.OUTLET_CMP_INPUT_INSTANCE_ID, ELEMENT_ID)
    .addBoundAttribute(consts.OUTLET_CMP_INPUT_RENDER_ID, rootIdBinding)
    .addElementClassPrefixBinding(addNgForIndexToId, slotName)
    .addBoundAttribute(consts.OUTLET_CMP_INPUT_PROPERTIES_MAP)
    .addBoundAttribute(consts.OUTLET_CMP_INPUT_STYLES_MAP)
    .addBoundAttribute(consts.OUTLET_CMP_INPUT_ASSETS)
    .addBoundAttribute(consts.OUTLET_CMP_INPUT_ADD_MARKER, String(false))
    .addBoundAttribute(consts.OUTLET_CMP_INPUT_DESIGN_SYSTEM)
    .addAttribute(consts.OUTLET_CMP_INPUT_TYPE, cd.OutletType.Portal)
    .addBoundAttribute(consts.OUTLET_CMP_ANCESTORS_ATTR)
    .addBoundAttribute(consts.OUTLET_CMP_INPUT_DATASETS)
    .addBoundAttribute(consts.OUTLET_CMP_INPUT_LOADED_DATA)
    .build();

  const portalWrapper = new TemplateFactory(cd.TemplateBuildMode.Internal, consts.DIV_TAG)
    .addCSSClass(consts.PORTAL_WRAPPER_CLASS)
    .addChild(boardInstance);

  if (slotName) {
    const [attrName, attrValue] = getSlotAttrNameValue(slotName, addNgForIndexToSlotName);
    portalWrapper.addAttribute(attrName, attrValue);
  }

  return portalWrapper;
};

export const generatePortalZeroState = (
  referenceIdLookup: string,
  portalErrorRef = PORTAL_ERROR_TEMPLATE_REF,
  isChild: boolean = false,
  slotName?: string,
  addNgForIndexToSlotName = false,
  zeroStateMessage?: string
) => {
  const HAS_REFERENCE_MODEL_CONDITION = `${referenceIdLookup} ${HAS_VALUE_PIPE}`;

  const zeroState = new TemplateFactory(cd.TemplateBuildMode.Internal, consts.DIV_TAG)
    .addCSSClass(CD_PORTAL_ZERO_STATE_CLASS)
    .addConditionalCSSClass(CD_PORTAL_ERROR_STATE_CLASS, HAS_REFERENCE_MODEL_CONDITION);

  if (!isChild) zeroState.addDefaultAttributes().addFitContentClass();
  if (slotName) {
    const [attrName, attrValue] = getSlotAttrNameValue(slotName, addNgForIndexToSlotName);
    zeroState.addAttribute(attrName, attrValue);
  }
  if (zeroStateMessage) zeroState.addCssVar(PORTAL_ZERO_STATE_MESSAGE_VAR, zeroStateMessage, true);

  return `<ng-template #${portalErrorRef}>${zeroState.build()}</ng-template>`;
};

export const buildChildPortal = (
  portalRefBinding: string,
  addNgForIndexToId = true,
  slotName?: string,
  addNgForIndexToSlotName = false,
  zeroStateMessage?: string
): string => {
  const isValidPortal = circularOutletGuard(portalRefBinding);
  const portalErrorRef = slotName
    ? `${PORTAL_ERROR_TEMPLATE_REF}${removeSpecialCharacters(slotName)}`
    : PORTAL_ERROR_TEMPLATE_REF;

  const portalFactory = generatePortal(
    addNgForIndexToId,
    portalRefBinding,
    slotName,
    addNgForIndexToSlotName
  )
    .addCSSClass(CD_CHILD_PORTAL_CLASS)
    .add_ngIf_else_Attribute(isValidPortal, portalErrorRef);

  const portalZeroState = generatePortalZeroState(
    portalRefBinding,
    portalErrorRef,
    true,
    slotName,
    addNgForIndexToSlotName,
    zeroStateMessage
  );
  return [portalFactory.build(), portalZeroState].join('');
};
