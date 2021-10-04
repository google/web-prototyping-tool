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
import * as utils from 'cd-common/models';
import * as consts from 'cd-common/consts';

export const MAT_ACCORDION_TAG = 'mat-accordion';
export const MAT_EXP_PANEL_HEADER = 'mat-expansion-panel-header';
export const MAT_EXPANSION_PANEL = 'mat-expansion-panel';
export const MAT_PANEL_TITLE = 'mat-panel-title';
export const DISPLAY_MODE = 'displayMode';
export const EXPANDED_ATTR = 'expanded';
export const HIDE_TOGGLE = 'hideToggle';
export const TOGGLE_POSITION = 'togglePosition';
export const MULTI_ATTR = 'multi';
const PANEL = 'panel';

export default function (mode: cd.TemplateBuildMode, props: cd.IExpansionPanelProperties): string {
  const { displayMode, hideToggle, togglePosition, multi } = props.inputs;
  return new utils.TemplateFactory(mode, MAT_ACCORDION_TAG, props)
    .ifInternal((me) =>
      me
        .addDefaultAttributes()
        .addPropsBoundInputAttribute(DISPLAY_MODE)
        .addPropsBoundInputAttribute(HIDE_TOGGLE)
        .addPropsBoundInputAttribute(TOGGLE_POSITION)
        .addPropsBoundInputAttribute(MULTI_ATTR)
        .addChild(buildInternalContent())
    )
    .ifExport((me) =>
      me
        .addAttribute(DISPLAY_MODE, displayMode)
        .addAttribute(TOGGLE_POSITION, togglePosition)
        .addAttribute(HIDE_TOGGLE, hideToggle, false)
        .addAttribute(MULTI_ATTR, multi, false)
        .addChild(buildExportContent(props))
    )
    .build();
}

const buildInternalContent = (): string => {
  const panelPath =
    utils.inputPropsBinding(utils.CHILD_PORTALS_INPUT) + utils.wrapInBrackets(utils.INDEX_VAR);
  const panelNamePath = utils.lookupPropAtPath(panelPath, consts.NAME_ATTR);
  const panelValuePath = utils.lookupPropAtPath(panelPath, consts.VALUE_ATTR);
  const panelDisabledPath = utils.lookupPropAtPath(panelPath, consts.DISABLED_ATTR);
  const panelExpandedPath = utils.lookupPropAtPath(panelPath, consts.SELECTED_ATTR);
  const labelContent = utils.wrapInCurlyBraces(panelNamePath);
  const matPanelTitle = new utils.TemplateFactory(cd.TemplateBuildMode.Internal, MAT_PANEL_TITLE)
    .addChild(labelContent)
    .build();
  const matExpPanelHeader = new utils.TemplateFactory(
    cd.TemplateBuildMode.Internal,
    MAT_EXP_PANEL_HEADER
  )
    .addChild(matPanelTitle)
    .build();

  const portal = utils.buildChildPortal(panelValuePath);
  const children = matExpPanelHeader + portal;

  return new utils.TemplateFactory(cd.TemplateBuildMode.Internal, MAT_EXPANSION_PANEL)
    .add_ngFor_Attribute(PANEL, utils.CHILD_PORTALS_INPUT, true)
    .addBoundAttribute(consts.DISABLED_ATTR, panelDisabledPath)
    .addBoundAttribute(EXPANDED_ATTR, panelExpandedPath)
    .addChild(children)
    .build();
};

// Creates an actual tag for each expansion panel instead of using an ngFor
const buildExportContent = (props: cd.IExpansionPanelProperties): string => {
  return props.inputs.childPortals.reduce((html: string, portal: cd.IGenericConfig) => {
    const { value, disabled, selected } = portal;
    const panelContent = utils.generateTemplateContent([value as string]);

    const panel = new utils.TemplateFactory(cd.TemplateBuildMode.Simple, MAT_EXPANSION_PANEL)
      .addAttribute(consts.DISABLED_ATTR, disabled, false)
      .addAttribute(EXPANDED_ATTR, selected, false)
      .addChild(panelContent)
      .build();

    return html + panel;
  }, '');
};
