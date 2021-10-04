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

import {
  buildCSS,
  buildRule,
  classNameFromProps,
  createPixelIValue,
  fontURLFromDesignSystem,
  generateIconFontFamilyCSSVar,
  generateStyle,
  makeSelector,
} from 'cd-common/utils';
import { OUTLET_CMP_INPUT_RENDER_ID } from 'cd-common/consts';
import { getComponent, getComponents, getAliasesIDs, generateTemplateContent } from './registry';
import { ELEMENT_ID, TemplateFactory } from './template.utils';
import { toPascalCase } from 'cd-utils/string';
import { createInstance } from './instance.utils';
import { isBoard } from './properties.utils';
import { deepCopy } from 'cd-utils/object';
import * as cd from 'cd-interfaces';

const ROOT_REF = 'cdRootRef';
const INTERNAL_PROJ_ID = '_internalProjectId';
const INTERNAL_ID = '_internalId';
const ROOT_TYPES = [cd.ElementEntitySubType.Symbol, cd.ElementEntitySubType.Board];

export const generateChildIterator = (entities: Array<cd.ComponentIdentity>): string => {
  const templateRefs = entities.map((entity) => templateRef(entity));
  const switchCases = entities.map((entity) => `'${entity}'`);
  return `
  <ng-template #children let-childIds cdRenderSwitch [cases]="[${switchCases}]" [templateRefs]="[${templateRefs}]">
    <ng-container *ngFor="let childId of childIds; trackBy:trackByFn"
      cdRenderChild
      [childId]="childId"
      [props]="propertiesMap"
    ></ng-container>
  </ng-template>`;
};

const templateRef = (key: cd.ComponentIdentity): string => {
  if (ROOT_TYPES.includes(key as cd.ElementEntitySubType)) return ROOT_REF;
  const casedKey = toPascalCase(key);
  return `cd${casedKey}Ref`;
};

const entryTemplate = (_id?: string, _ref?: string): string => {
  return `<ng-container [ngTemplateOutlet]="${ROOT_REF}" [ngTemplateOutletContext]="{ $implicit: ${OUTLET_CMP_INPUT_RENDER_ID} }"></ng-container>`;
};

const buildNGTemplate = (ref: string, variableName: string, contents: string): string => {
  return `<ng-template #${ref} let-${variableName}>${contents}</ng-template>`;
};

const generateTemplates = (entityTypes: Array<cd.ComponentIdentity>): string => {
  return entityTypes.reduce((html, entity) => {
    // Symbol and Board share same template, so we don't need to generate twice
    if (entity === cd.ElementEntitySubType.Symbol) return html;
    const cmp = getComponent(entity);
    if (!cmp) return '';

    // Create HTML from template factory
    const props = createInstance(cmp.id, INTERNAL_PROJ_ID, INTERNAL_ID);
    const content = cmp.template(cd.TemplateBuildMode.Internal, props);
    const container = `<ng-container *ngIf="propertiesMap[${ELEMENT_ID}]; let props">${content}</ng-container>`;
    const ref = templateRef(entity);
    const template = buildNGTemplate(ref, ELEMENT_ID, container);
    html += template;

    return html;
  }, '');
};

/** Generate an HTML string for ALL component templates. */
export const assembleAllTemplates = (): string => {
  // Create templates for all built-in and code components
  const allComponentIds = [...getComponents().map((c) => c.id), ...getAliasesIDs()];
  const entryPoint = entryTemplate();
  const templates = generateTemplates(allComponentIds);
  const childIterator = generateChildIterator(allComponentIds);
  return entryPoint + childIterator + templates;
};

/** Generates an HTML string Recursively for specific components being exported. */
export const assembleTemplatesForExport = (
  rootIds: string[],
  projectProperties: cd.ElementPropertiesMap,
  projectAssets: Record<string, cd.IProjectAsset> = {}
): string => {
  // Set current project-level static fields for recursive rendering
  TemplateFactory.projectProperties = projectProperties;
  TemplateFactory.projectAssets = projectAssets;

  // Recursively render all templates and children
  const html = generateTemplateContent(rootIds);
  return html;
};

const getAllDecendantIds = (
  elementId: string,
  props: cd.ElementPropertiesMap
): ReadonlyArray<string> => {
  const element = props[elementId];
  const idList: string[] = [elementId];
  const childIds = element?.childIds ? [...element.childIds] : [];
  const refId = (element?.inputs as any)?.referenceId;
  if (refId) childIds.push(refId);
  if (childIds.length) {
    const ids = childIds.flatMap((childId) => getAllDecendantIds(childId, props));
    if (ids.length) idList.push(...ids);
  }
  return idList;
};
/** Generates an HTML string Recursively for specific components being exported. */
export const assembleTemplatesWithCSSForExport = (
  startIds: string[],
  projectProperties: cd.ElementPropertiesMap,
  designSystem: cd.IDesignSystem,
  assets: Record<string, cd.IProjectAsset> = {}
): string => {
  const bindings: cd.IProjectBindings = { assets, designSystem };
  const elements = Object.values(projectProperties);
  const validIds = new Set(startIds.flatMap((id) => getAllDecendantIds(id, projectProperties)));
  const stylesMap = elements.reduce<cd.IStringMap<cd.IStyleAttributes>>((acc, curr) => {
    if (!curr) return acc;
    if (!validIds.has(curr.id)) return acc;

    const elemStyles = deepCopy(curr.styles);
    // For Boards we want to set the dimension to that of the frame
    if (isBoard(curr)) {
      Object.assign(elemStyles.base.style, {
        width: createPixelIValue(curr.frame.width),
        height: createPixelIValue(curr.frame.height),
      });
    }

    const styles = generateStyle(elemStyles, bindings);

    acc[curr.id] = styles;
    return acc;
  }, {});

  const classMap = elements.reduce<Map<string, string>>((acc, curr) => {
    if (!curr) return acc;
    acc.set(curr.id, classNameFromProps(curr));
    return acc;
  }, new Map());

  const sheet = new CSSStyleSheet();

  let idx = 0;
  for (const [id, style] of Object.entries(stylesMap)) {
    const className = classMap.get(id);
    if (!className) continue;
    const rules = Object.entries(style);
    for (const [key, value] of rules) {
      const selector = makeSelector(className, key);
      const cssText = buildCSS(value as any);
      const rule = buildRule(selector, cssText);
      sheet.insertRule(rule, idx);
      idx++;
    }
  }

  const csstext = Object.values(sheet.cssRules).reduce((acc, curr) => {
    return (acc += curr.cssText + '\n');
  }, '');
  const fontUrl = fontURLFromDesignSystem(designSystem);
  const font = `<link href="${fontUrl}" rel="stylesheet"/>`;
  const iconVar = generateIconFontFamilyCSSVar(designSystem.icons);
  const iconFontFamily = `:root{${iconVar.join(':')}}`;
  const CSS_RESET = '*, *::before, *::after { box-sizing: border-box; }';
  const styleSheet = `<style>${[CSS_RESET, iconFontFamily, csstext].join('\n')}</style>`;
  // Set current project-level static fields for recursive rendering
  TemplateFactory.projectProperties = projectProperties;
  TemplateFactory.projectAssets = assets;
  // Recursively render all templates and children
  const html = generateTemplateContent(startIds);
  return [font, styleSheet, html].join('\n');
};
