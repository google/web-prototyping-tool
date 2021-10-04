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

import { IA11yAttr, IA11yInputs } from 'cd-interfaces';
import { ariaAttrNames, ariaRoleDefaults, ariaTagRoles } from 'cd-metadata/aria';
import * as consts from 'cd-common/consts';

export const isA11yAttrDisabled = (attr: IA11yAttr): boolean => {
  return attr.disabled || attr.invalid || attr.value === '' || attr.value === undefined;
};

export const isA11yInfoModified = (a11yInputs: IA11yInputs): boolean => {
  return !!(a11yInputs?.ariaAttrs?.length || a11yInputs?.notes);
};

export const getA11yAttrLabel = (attrName: string): string => ariaAttrNames[attrName] || attrName;

export const getAriaLevelFromHeadingElement = (element: HTMLElement) => {
  const ariaLevelFromElement = element.getAttribute(consts.ARIA_LEVEL_ATTR);
  const implicitAriaLevelFromRole = getDefaultAttrValueForRole(
    consts.HEADING_ROLE,
    consts.ARIA_LEVEL_ATTR
  );
  return ariaLevelFromElement || implicitAriaLevelFromRole;
};

export const getDefaultAttrValueForRole = (
  role: string,
  attrName: string
): string | number | undefined => {
  const defaultAttrsForRole = ariaRoleDefaults[role];
  const targetAttr = defaultAttrsForRole.find((attr: IA11yAttr) => attr.name === attrName);
  return targetAttr?.value;
};

export const getImplicitRoleFromTag = (elementTag: string): string | undefined => {
  return ariaTagRoles[elementTag];
};

export const findA11yAttributeByName = (
  ariaAttrs: IA11yAttr[] = [],
  lookup: string
): IA11yAttr | undefined => {
  return ariaAttrs.find((attr: IA11yAttr) => attr.name === lookup);
};

export const isAttrRoleDefault = (attr: IA11yAttr, role: string): boolean => {
  const roleDefaultAttrs = ariaRoleDefaults[role];
  if (!roleDefaultAttrs || !roleDefaultAttrs.length) return false;
  const defaultAttr = findA11yAttributeByName(roleDefaultAttrs, attr.name);
  return attr.value === defaultAttr?.value;
};
