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
  TemplateFactory,
  generateTemplateContent,
  inputPropsBinding,
  lookupPropAtPath,
  wrapInBrackets,
  wrapInCurlyBraces,
  INDEX_VAR,
  CHILD_PORTALS_INPUT,
  buildChildPortal,
} from 'cd-common/models';
import {
  getIconElementExportTemplate,
  getIconElementTemplate,
} from '../../primitive/icon/icon.template';

export const MAT_TAB_GROUP_TAG = 'mat-tab-group';
export const MAT_TAB = 'mat-tab';
export const MAT_TAB_LABEL_DIRECTIVE = 'mat-tab-label';
const CD_TAB_GROUP_CLASS = 'cd-mat-tab-group';
const TAB_INDEX_OUTPUT = 'selectedIndexChange';
const TAB = 'tab';

export default function (mode: cd.TemplateBuildMode, props: cd.ITabProperties): string {
  return new TemplateFactory(mode, MAT_TAB_GROUP_TAG, props)
    .ifInternal((me) =>
      me
        .addDefaultAttributes()
        .addPropsBoundInputAttribute(consts.SELECTED_INDEX_ATTR)
        .addPropsBoundInputAttribute(consts.COLOR_ATTR)
        .addOutputBinding(TAB_INDEX_OUTPUT, consts.SELECTED_INDEX_ATTR)
        .addCSSClass(CD_TAB_GROUP_CLASS)
        .addChild(buildInternalContent())
    )
    .ifExport((me) =>
      me
        .addAttribute(consts.SELECTED_INDEX_ATTR, props?.inputs.selectedIndex, false)
        .addChild(buildExportContent(props))
    )
    .build();
}

const buildInternalContent = (): string => {
  const tabPath = inputPropsBinding(CHILD_PORTALS_INPUT) + wrapInBrackets(INDEX_VAR);
  const tabNamePath = lookupPropAtPath(tabPath, consts.NAME_ATTR);
  const tabIconPath = lookupPropAtPath(tabPath, consts.ICON_ATTR);
  const tabValuePath = lookupPropAtPath(tabPath, consts.VALUE_ATTR);
  const tabDisabledPath = lookupPropAtPath(tabPath, consts.DISABLED_ATTR);

  const iconElement = getIconElementTemplate(tabIconPath);

  const spanElem = new TemplateFactory(cd.TemplateBuildMode.Internal, consts.SPAN_TAG)
    .addChild(wrapInCurlyBraces(tabNamePath))
    .add_ngIf_Attribute(tabNamePath)
    .build();

  const template = new TemplateFactory(cd.TemplateBuildMode.Internal, consts.NG_TEMPLATE)
    .addDirective(MAT_TAB_LABEL_DIRECTIVE)
    .addChild(iconElement + spanElem)
    .build();

  const portal = buildChildPortal(tabValuePath);
  const tabContents = template + portal;

  return new TemplateFactory(cd.TemplateBuildMode.Internal, MAT_TAB)
    .add_ngFor_Attribute(TAB, CHILD_PORTALS_INPUT, true)
    .addBoundAttribute(consts.DISABLED_ATTR, tabDisabledPath)
    .addChild(tabContents)
    .build();
};

const buildExportContent = (props: cd.ITabProperties): string => {
  return props.inputs.childPortals.reduce((html: string, portal: cd.IGenericConfig) => {
    const { value, disabled, name, icon } = portal;

    const tabLabelChildren: string[] = [];
    const spanElem = new TemplateFactory(cd.TemplateBuildMode.Simple, consts.SPAN_TAG)
      .addChild(name)
      .build();
    tabLabelChildren.push(spanElem);

    if (icon) {
      const iconElement = getIconElementExportTemplate(icon);
      tabLabelChildren.push(iconElement);
    }

    const tabLabel = new TemplateFactory(cd.TemplateBuildMode.Simple, consts.NG_TEMPLATE)
      .addAttribute(MAT_TAB_LABEL_DIRECTIVE, undefined, true)
      .addChild(tabLabelChildren.join(''))
      .build();

    const tabContent = !!value ? generateTemplateContent([value]) : '';

    const tab = new TemplateFactory(cd.TemplateBuildMode.Simple, MAT_TAB)
      .addAttribute(consts.DISABLED_ATTR, disabled, false)
      .addChild(tabLabel + tabContent)
      .build();

    return html + tab;
  }, '');
};
