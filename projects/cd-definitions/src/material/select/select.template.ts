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

import { MAT_GAP_FIX_DIRECTIVE } from '../directives/mat-label-fix.directive';
import * as cd from 'cd-interfaces';
import * as consts from 'cd-common/consts';
import * as mat from '../material-shared';
import {
  TemplateFactory,
  lookupPropAtPath,
  propsBinding,
  wrapInCurlyBraces,
  INPUTS,
} from 'cd-common/models';

export const SELECT_TAG = 'mat-select';
export const OPTION_TAG = 'mat-option';
export const MAT_FORM_FIELD_TAG = 'mat-form-field';
const SEL_TRIGGER_TAG = 'mat-select-trigger';
const OPTION_VAR = 'option';
const SELECTION_CHANGE = 'selectionChange';
const MAT_SELECT_FIX_PIPE = 'matSelectFix';

export default function (mode: cd.TemplateBuildMode, props: cd.ISelectProperties): string {
  return new TemplateFactory(mode, MAT_FORM_FIELD_TAG)
    .ifInternal((me) =>
      me
        .addWrapper(
          new TemplateFactory(mode, consts.DIV_TAG).addDefaultAttributes().addFitContentClass()
        )
        .addDirective(MAT_GAP_FIX_DIRECTIVE)
        .addPropsBoundInputAttribute(mat.APPEARANCE_TAG)
        .addPropsBoundInputAttribute(consts.COLOR_ATTR)
        .addChild(buildInternalContent())
    )
    .ifExport((me) =>
      me
        .addAttribute(consts.COLOR_ATTR, props.inputs.color)
        .addChild(buildExportContent(props))
        .build()
    )
    .build();
}

const buildInternalContent = (): string => {
  const mode = cd.TemplateBuildMode.Internal;
  const labelElem = new mat.MaterialLabel('').template(mode);
  const optionValue = lookupPropAtPath(OPTION_VAR, consts.VALUE_ATTR); // option.value
  const optionDisabled = lookupPropAtPath(OPTION_VAR, consts.DISABLED_ATTR); // option.disabled
  const optionText = lookupPropAtPath(OPTION_VAR, consts.NAME_ATTR); // option.name
  const selectTriggerContent = `${propsBinding(INPUTS)} | ${MAT_SELECT_FIX_PIPE}`;

  const selectTriggerElem = new TemplateFactory(mode, SEL_TRIGGER_TAG)
    .addChild(wrapInCurlyBraces(selectTriggerContent))
    .build();

  const optionElem = new TemplateFactory(mode, OPTION_TAG)
    .add_ngFor_Attribute(OPTION_VAR, consts.OPTIONS_ATTR, true) // for option of options
    .addBoundAttribute(consts.VALUE_ATTR, optionValue)
    .addBoundAttribute(consts.DISABLED_ATTR, optionDisabled)
    .addBoundAttribute(consts.INNER_TEXT, optionText)
    .build();

  const selectElem = new TemplateFactory(mode, SELECT_TAG)
    .addPropsBoundInputAttribute(consts.DISABLED_ATTR, undefined, true, cd.CoerceValue.Boolean)
    .addPropsBoundInputAttribute(consts.REQUIRED_ATTR, undefined, true, cd.CoerceValue.Boolean)
    .addPropsBoundInputAttribute(consts.VALUE_ATTR)
    .addOutputBinding(SELECTION_CHANGE, consts.VALUE_ATTR, consts.VALUE_ATTR)
    .addChild(selectTriggerElem)
    .addChild(optionElem)
    .build();

  const hintElem = new mat.MaterialHint('').template(mode);

  return labelElem + selectElem + hintElem;
};

const buildExportContent = (props: cd.ISelectProperties): string => {
  const mode = cd.TemplateBuildMode.Simple;
  const { options, disabled, hint, required, label, value } = props.inputs;
  const optionsHtml: string[] = [];
  const selectedIndex = options.findIndex((item) => item.value === value);
  for (const [index, option] of options.entries()) {
    const { disabled: optionDisabled, name } = option;
    const selected = selectedIndex === index;
    optionsHtml.push(
      new TemplateFactory(mode, OPTION_TAG)
        .addAttribute(consts.DISABLED_ATTR, optionDisabled, false)
        .addAttribute(consts.SELECTED_ATTR, selected, false)
        .addChild(name)
        .build()
    );
  }

  const selectElem = new TemplateFactory(mode, SELECT_TAG)
    .addAttribute(consts.DISABLED_ATTR, disabled, false)
    .addAttribute(consts.REQUIRED_ATTR, required, false)
    .addChild(optionsHtml.join(''))
    .build();

  const labelElem = label ? new mat.MaterialLabel('').template(mode, props) : '';
  const hintElem = hint ? new mat.MaterialHint('').template(mode, props) : '';

  return [labelElem, selectElem, hintElem].join('');
};
