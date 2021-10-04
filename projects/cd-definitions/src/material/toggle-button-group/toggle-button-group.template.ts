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
import { TemplateFactory, lookupPropAtPath, wrapInCurlyBraces } from 'cd-common/models';
import { getIconElementTemplate } from '../../primitive/icon/icon.template';

export const MAT_TOGGLE_BUTTON = 'mat-button-toggle';
export const MAT_TOGGLE_BUTTON_GROUP_TAG = 'mat-button-toggle-group';
export const MULTIPLE_ATTR = 'multiple';
export const VERTICAL_ATTR = 'vertical';
export const BUTTONS_ATTR = 'buttons';
export const SMALL_ATTR = 'small';
export const BUTTON_VAR = 'button';

export const BUTTON_SELECTED_EVENT = 'buttonSelected';
export const BUTTON_UNSELECTED_EVENT = 'buttonUnselected';

const TOGGLE_BUTTON_GROUP_DIRECTIVE = 'cdMatToggleButtonGroup';
const SMALL_CLASS = 'cd-button-toggle-group-small';
const TOGGLE_BUTTON_GROUP_WRAPPER_CLASS = 'mat-button-toggle-group-wrapper';
const BUTTON_HAS_TEXT_CLASS = 'cd-button-has-text';
const GROUP_VALUE_ATTR = 'groupValue';

export default function (
  mode: cd.TemplateBuildMode,
  props: cd.IToggleButtonGroupProperties
): string {
  const group = new TemplateFactory(mode, MAT_TOGGLE_BUTTON_GROUP_TAG, props)
    .ifInternal((template) =>
      template
        .addDefaultAttributes()
        .addFitContentClass()
        .addDirective(TOGGLE_BUTTON_GROUP_DIRECTIVE)
        .addPropsBoundInputAttribute(GROUP_VALUE_ATTR, consts.VALUE_ATTR)
        .addPropsBoundInputAttribute(consts.VARIANT_ATTR)
        .addPropsBoundInputAttribute(consts.COLOR_ATTR)
        .addClassPropsBinding(SMALL_CLASS, SMALL_ATTR, true, true, cd.CoerceValue.Boolean)
        .addPropsBoundInputAttribute(consts.DISABLED_ATTR)
        .addPropsBoundInputAttribute(MULTIPLE_ATTR)
        .addPropsBoundInputAttribute(VERTICAL_ATTR)
        .addOutputBinding(BUTTON_SELECTED_EVENT, BUTTON_SELECTED_EVENT)
        .addOutputBinding(BUTTON_UNSELECTED_EVENT, BUTTON_UNSELECTED_EVENT)
        .addOutputBinding(consts.CHANGE_OUTPUT_BINDING, consts.VALUE_ATTR, consts.VALUE_ATTR)
        .addChild(buildInternalContent())
    )
    .ifExport((template) =>
      template
        .addAttribute(consts.VALUE_ATTR, props.inputs.value)
        .addAttribute(MULTIPLE_ATTR, props.inputs.multiple, false)
        .addAttribute(VERTICAL_ATTR, props.inputs.vertical, false)
        .addAttribute(consts.DISABLED_ATTR, props.inputs.disabled, false)
        .addChild(buildExportContent(props))
    )
    .build();
  return group;
}

const buildInternalContent = (): string => {
  const buttonValue = lookupPropAtPath(BUTTON_VAR, consts.VALUE_ATTR);
  const buttonIcon = lookupPropAtPath(BUTTON_VAR, consts.ICON_ATTR);
  const buttonLabel = lookupPropAtPath(BUTTON_VAR, consts.NAME_ATTR);
  const text = wrapInCurlyBraces(buttonLabel);
  const tooltip = lookupPropAtPath(BUTTON_VAR, consts.TOOLTIP_LABEL_ATTR);
  const disabled = lookupPropAtPath(BUTTON_VAR, consts.DISABLED_ATTR);

  const toggleButtons = new TemplateFactory(cd.TemplateBuildMode.Internal, MAT_TOGGLE_BUTTON)
    .add_ngFor_Attribute(BUTTON_VAR, BUTTONS_ATTR)
    .addBoundAttribute(consts.VALUE_ATTR, buttonValue)
    .addBoundAttribute(consts.DISABLED_ATTR, disabled)
    .addBoundAttribute(consts.ARIA_LABEL_ATTR, tooltip)
    .addBoundAttribute(consts.CD_CO_TOOLTIP, tooltip)
    .addAttribute(consts.CD_CO_TOOLTIP_POSITION, cd.Position.Bottom)
    .addConditionalCSSClass(BUTTON_HAS_TEXT_CLASS, buttonLabel)
    .addChild(getIconElementTemplate(buttonIcon))
    .addChild(text);

  return new TemplateFactory(cd.TemplateBuildMode.Internal, consts.DIV_TAG)
    .addCSSClass(TOGGLE_BUTTON_GROUP_WRAPPER_CLASS)
    .addChild(toggleButtons.build())
    .build();
};

const buildExportContent = (props: cd.IToggleButtonGroupProperties): string => {
  const { buttons } = props.inputs;
  const buttonsHtml: string[] = [];

  for (const button of buttons) {
    const { disabled, name, value } = button;
    buttonsHtml.push(
      new TemplateFactory(cd.TemplateBuildMode.Simple, MAT_TOGGLE_BUTTON)
        .addAttribute(consts.DISABLED_ATTR, disabled, false)
        .addAttribute(consts.VALUE_ATTR, value)
        .addChild(name)
        .build()
    );
  }

  return buttonsHtml.join('');
};
