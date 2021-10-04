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
import * as mat from '../material-shared';
import { INDEX_VAR, inputPropsBinding, TemplateFactory, wrapInCurlyBraces } from 'cd-common/models';
import { MAT_GAP_FIX_DIRECTIVE } from '../directives/mat-label-fix.directive';
import { MAT_CHIP, MAT_CHIP_LIST_TAG } from '../chips/chips.template';
import { VALUE_CHANGE_BINDING } from '../../shared';
import { CHIP_SEPARATOR_KEYS } from '../directives/mat-chips-input.directive';

const INPUT_EVENT_TARGET = `target?.${consts.VALUE_ATTR}`;
const AUTOCOMPLETE_ATTR = 'autocomplete';
const OFF_VALUE = 'off';
const TEXTAREA_RESIZE_DIRECTIVE = 'cdkTextareaAutosize';
const TEXTAREA_MIN_ROWS = 'cdkAutosizeMinRows';
const TEXTAREA_MAX_ROWS = 'cdkAutosizeMaxRows';
export const INPUT_TYPE_ATTR = 'inputType';
export const INPUT_ROW_MIN = 'rowMin';
export const INPUT_ROW_MAX = 'rowMax';

export const USE_CHIPS_ATTR = 'useChips';
const CHIP_VAR = 'chip';
const CHIP_LIST_SELECTOR = 'chipList';
const CHIP_REMOVE_ICON = 'cancel';
const REMOVABLE_CHIP_ATTR = 'removable';
const SELECTABLE_CHIP_ATTR = 'selectable';
const CHIP_INDEX_ATTR = 'index';
const CD_INPUT_CHIP_DIRECTIVE = 'cdMatInputChip';
const CD_INPUT_CHIPS_DIRECTIVE = 'cdMatInputChips';

export default function (mode: cd.TemplateBuildMode, props: cd.IInputProperties): string {
  const internalContent =
    buildInputType(consts.INPUT_TAG, true) +
    buildInputType(consts.TEXT_AREA_TAG, false, false, false);

  if (mode === cd.TemplateBuildMode.Internal) {
    return new TemplateFactory(mode, consts.DIV_TAG, props)
      .addDefaultAttributes()
      .addFitContentClass()
      .addPropsBoundInputAttribute(consts.NG_SWITCH, consts.TYPE_ATTR)
      .addChild(internalContent)
      .build();
  }
  // Handle template export
  return new TemplateFactory(mode, mat.MAT_FORM_FIELD_TAG)
    .addChild(buildExportContent(props))
    .build();
}

/** Generate an <input> or <textarea> inside a <mat-form-field> */
const buildInputType = (
  tag: string,
  isDefault = false,
  includeSuffixIcon = true,
  includeChips = true
) => {
  const mode = cd.TemplateBuildMode.Internal;
  const labelElem = new mat.MaterialLabel('').template(mode);
  const iconElem = new mat.MaterialIconSuffix('').template(mode);
  const hintElem = new mat.MaterialHint('').template(mode);

  // input without chips
  const inputElem = buildBaseInput(mode, tag)
    .addPropsBoundInputAttribute(consts.VALUE_ATTR, undefined, true, cd.CoerceValue.String)
    .addOutputBinding(consts.INPUT_BINDING, consts.VALUE_ATTR, INPUT_EVENT_TARGET);
  const suffix = includeSuffixIcon ? [iconElem] : [];

  const formFieldContent = [labelElem];
  if (includeChips) {
    const chipList = buildChipsList(mode, tag)
      .add_ngIf_Attribute(inputPropsBinding(USE_CHIPS_ATTR))
      .build();
    formFieldContent.push(chipList);
    inputElem.add_ngIf_Attribute(`!${inputPropsBinding(USE_CHIPS_ATTR)}`);
  }
  formFieldContent.push(...[inputElem.build(), ...suffix, hintElem]);
  const formField = new TemplateFactory(mode, mat.MAT_FORM_FIELD_TAG)
    .addDirective(MAT_GAP_FIX_DIRECTIVE)
    .addPropsBoundInputAttribute(mat.MAT_APPEARANCE_TAG)
    .addPropsBoundInputAttribute(consts.COLOR_ATTR)
    .addChild(formFieldContent.join(''));

  if (isDefault) formField.addSwitchDefault();
  else formField.addSwitchCase(`'${tag}'`);

  return formField.build();
};

const buildBaseInput = (
  mode: cd.TemplateBuildMode,
  tag: string,
  inputs?: cd.IInputElementInputs
): TemplateFactory => {
  const input = new TemplateFactory(mode, tag).addDirective(mat.MAT_INPUT_DIRECTIVE);

  if (tag === consts.TEXT_AREA_TAG) {
    input
      .addDirective(TEXTAREA_RESIZE_DIRECTIVE)
      .addPropsBoundInputAttribute(TEXTAREA_MIN_ROWS, INPUT_ROW_MIN, true)
      .addPropsBoundInputAttribute(TEXTAREA_MAX_ROWS, INPUT_ROW_MAX, true);
  }

  if (mode === cd.TemplateBuildMode.Simple) {
    if (!inputs) return input;
    const { inputType, placeholder, disabled, required } = inputs;
    input
      .addAttribute(consts.TYPE_ATTR, inputType, false)
      .addAttribute(consts.PLACEHOLDER_ATTR, placeholder, false)
      .addAttribute(consts.DISABLED_ATTR, disabled, false)
      .addAttribute(consts.REQUIRED_ATTR, required, false);
  } else {
    input
      .addAttribute(AUTOCOMPLETE_ATTR, OFF_VALUE)
      .addPropsBoundInputAttribute(consts.DISABLED_ATTR, undefined, true, cd.CoerceValue.Boolean)
      .addPropsBoundInputAttribute(consts.REQUIRED_ATTR, undefined, true, cd.CoerceValue.Boolean)
      .addPropsBoundInputAttribute(consts.PLACEHOLDER_ATTR, undefined, true, cd.CoerceValue.String)
      .addPropsBoundInputAttribute(consts.TYPE_ATTR, INPUT_TYPE_ATTR, true, cd.CoerceValue.String)
      .addOutputEventEmpty(consts.FOCUS_OUTPUT_BINDING)
      .addOutputEventEmpty(consts.BLUR_OUTPUT_BINDING);
  }

  return input;
};

const buildChipsList = (
  mode: cd.TemplateBuildMode,
  tag: string,
  inputs?: cd.IInputElementInputs
): TemplateFactory => {
  const chipContent = wrapInCurlyBraces(CHIP_VAR);
  const removeBtn = new TemplateFactory(mode, mat.MAT_ICON_TAG)
    .addDirective(mat.MAT_CHIP_REMOVE_DIRECTIVE)
    .addChild(CHIP_REMOVE_ICON)
    .build();
  const chips = new TemplateFactory(mode, MAT_CHIP)
    .addBoundAttribute(consts.VALUE_ATTR, CHIP_VAR)
    .addBoundAttribute(REMOVABLE_CHIP_ATTR, 'true')
    .addBoundAttribute(SELECTABLE_CHIP_ATTR, 'false')
    .addChild(chipContent)
    .addChild(removeBtn);
  const chipInput = buildBaseInput(mode, tag, inputs).addBoundAttribute(
    mat.MAT_CHIP_INPUT_FOR_DIRECTIVE,
    CHIP_LIST_SELECTOR
  );
  const chipList = new TemplateFactory(mode, MAT_CHIP_LIST_TAG).addDirective(
    `#${CHIP_LIST_SELECTOR}`
  );

  if (mode === cd.TemplateBuildMode.Simple) {
    const value = inputs?.value || consts.VALUE_ATTR;
    // export friendly ngFor
    chips.addDirective(`*ngFor="let ${CHIP_VAR} of '${value}'.split(',')"`);
    chipInput
      .addBoundAttribute(mat.MAT_CHIP_INPUT_SEPARATORS, `[${CHIP_SEPARATOR_KEYS}]`)
      .addBoundAttribute(mat.MAT_CHIP_INPUT_ON_ADD_BLUR, 'true');
  } else {
    chips
      .addDirective(CD_INPUT_CHIP_DIRECTIVE)
      .addBoundAttribute(CHIP_INDEX_ATTR, INDEX_VAR)
      .addPropsBoundInputAttribute(consts.COLOR_ATTR)
      .add_ngFor_Attribute(
        CHIP_VAR,
        consts.VALUE_ATTR,
        true,
        true,
        cd.CoerceValue.String,
        consts.CONVERT_VALUE_CHIPS_PIPE
      );
    chipList
      .addDirective(CD_INPUT_CHIPS_DIRECTIVE)
      .addPropsBoundInputAttribute(consts.DISABLED_ATTR, undefined, true, cd.CoerceValue.Boolean)
      .addPropsBoundInputAttribute(consts.REQUIRED_ATTR, undefined, true, cd.CoerceValue.Boolean)
      .addOutputBinding(VALUE_CHANGE_BINDING, consts.VALUE_ATTR);
  }

  chipList.addChild(chips.build()).addChild(chipInput.build());

  return chipList;
};

const buildExportContent = (props: cd.IInputProperties): string => {
  const mode = cd.TemplateBuildMode.Simple;
  const { label, hint, disabled, required, icon, type, value, useChips } = props.inputs;
  const labelElem = label ? new mat.MaterialLabel('').template(mode, props) : '';
  const hintElem = hint ? new mat.MaterialHint('').template(mode, props) : '';
  const iconElem = icon ? new mat.MaterialIconSuffix('').template(mode, props) : '';
  const inputTag = type || consts.INPUT_TAG;
  const inputElem = buildBaseInput(mode, inputTag, props.inputs)
    .addAttribute(consts.VALUE_ATTR, value, false)
    .build();

  const shouldBuildChips = useChips && type !== consts.TEXT_AREA_TAG;

  const chipList = buildChipsList(mode, inputTag, props.inputs)
    .addAttribute(consts.DISABLED_ATTR, disabled, false)
    .addAttribute(consts.REQUIRED_ATTR, required, false)
    .build();

  const input = shouldBuildChips ? chipList : inputElem;
  return [labelElem, input, iconElem, hintElem].join('');
};
