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
import { inputPropsBindingWithPipe, TemplateFactory } from 'cd-common/models';
import { MAT_GAP_FIX_DIRECTIVE } from '../directives/mat-label-fix.directive';

export const DATE_OUTPUT_BINDING = 'dateInput';
export const MAT_DATEPICKER_DIRECTIVE = 'matDatepicker';
export const MAT_DATEPICKER_TOGGLE_TAG = 'mat-datepicker-toggle';
export const MAT_DATEPICKER_TAG = 'mat-datepicker';
export const PICKER_TEMPLATE_REFERENCE = 'picker';
export const PICKER_REFERENCE_ATTR = `#${PICKER_TEMPLATE_REFERENCE}`;
const DATE_UTC_FIX_PIPE = 'matDateFix';

export default function (mode: cd.TemplateBuildMode, props: cd.IDatepickerProperties): string {
  return new TemplateFactory(mode, mat.MAT_FORM_FIELD_TAG, props)
    .ifInternal((me) =>
      me
        .addWrapper(
          new TemplateFactory(mode, consts.DIV_TAG).addDefaultAttributes().addFitContentClass()
        )
        .addDirective(MAT_GAP_FIX_DIRECTIVE)
        .addPropsBoundInputAttribute(mat.MAT_APPEARANCE_TAG)
        .addPropsBoundInputAttribute(consts.COLOR_ATTR)
        .addChild(buildInternalContent())
    )
    .ifExport((me) => me.addChild(buildExportContent(props)))
    .build();
}

const buildInternalContent = (): string => {
  const mode = cd.TemplateBuildMode.Internal;
  const labelElem = new mat.MaterialLabel('').template(mode);
  const hintElem = new mat.MaterialHint('').template(mode);
  const adjustedDateValue = inputPropsBindingWithPipe(consts.VALUE_ATTR, DATE_UTC_FIX_PIPE);
  const inputElem = new TemplateFactory(mode, consts.INPUT_TAG)
    .addDirective(mat.MAT_INPUT_DIRECTIVE)
    .addBoundAttribute(MAT_DATEPICKER_DIRECTIVE, PICKER_TEMPLATE_REFERENCE)
    .addPropsBoundInputAttribute(consts.DISABLED_ATTR, undefined, true, cd.CoerceValue.Boolean)
    .addPropsBoundInputAttribute(consts.REQUIRED_ATTR, undefined, true, cd.CoerceValue.Boolean)
    .addBoundAttribute(consts.VALUE_ATTR, adjustedDateValue)
    .addOutputBinding(DATE_OUTPUT_BINDING, consts.VALUE_ATTR, consts.VALUE_ATTR)
    .build();

  const toggleElem = new TemplateFactory(mode, MAT_DATEPICKER_TOGGLE_TAG)
    .addDirective(mat.MAT_SUFFIX_DIRECTIVE)
    .addBoundAttribute(consts.FOR_ATTR, PICKER_TEMPLATE_REFERENCE)
    .build();

  const datepickerElem = new TemplateFactory(mode, MAT_DATEPICKER_TAG)
    .addDirective(PICKER_REFERENCE_ATTR)
    .build();

  return [labelElem, inputElem, toggleElem, datepickerElem, hintElem].join('');
};

const buildExportContent = (props: cd.IDatepickerProperties): string => {
  const mode = cd.TemplateBuildMode.Simple;
  const { label, hint, disabled, required, value } = props.inputs;
  const labelElem = label
    ? new mat.MaterialLabel('').template(cd.TemplateBuildMode.Simple, props)
    : '';
  const hintElem = hint ? new mat.MaterialHint('').template(mode, props) : '';

  const inputElem = new TemplateFactory(mode, consts.INPUT_TAG)
    .addBoundAttribute(MAT_DATEPICKER_DIRECTIVE, PICKER_TEMPLATE_REFERENCE)
    .addAttribute(mat.MAT_INPUT_DIRECTIVE, undefined, true)
    .addAttribute(consts.DISABLED_ATTR, disabled, false)
    .addAttribute(consts.REQUIRED_ATTR, required, false)
    .addAttribute(consts.VALUE_ATTR, value, false)
    .build();

  const toggleElem = new TemplateFactory(mode, MAT_DATEPICKER_TOGGLE_TAG)
    .addBoundAttribute(consts.FOR_ATTR, PICKER_TEMPLATE_REFERENCE)
    .addAttribute(mat.MAT_SUFFIX_DIRECTIVE, undefined, true)
    .build();

  const datepickerElem = new TemplateFactory(mode, MAT_DATEPICKER_TAG)
    .addAttribute(PICKER_REFERENCE_ATTR, undefined, true)
    .build();

  return [labelElem, inputElem, toggleElem, datepickerElem, hintElem].join('');
};
