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
  inputPropsBinding,
  lookupPropAtPath,
  wrapInBrackets,
  INDEX_VAR,
  generateTemplateContent,
  CHILD_PORTALS_INPUT,
  buildChildPortal,
} from 'cd-common/models';

export const MAT_HORIZONTAL_STEPPER_TAG = 'mat-horizontal-stepper';
export const MAT_VERTICAL_STEPPER_TAG = 'mat-vertical-stepper';
export const MAT_STEP = 'mat-step';
const VERTICAL_STEPPER = 'verticalStepper';
const STEP = 'step';
const STEP_CHANGE_OUTPUT = 'selectionChange';

export default function (mode: cd.TemplateBuildMode, props: cd.IStepperProperties): string {
  const { selectedIndex, labelPosition, verticalStepper } = props.inputs;

  const tagName =
    mode === cd.TemplateBuildMode.Internal
      ? consts.NG_CONTAINER
      : verticalStepper
      ? MAT_VERTICAL_STEPPER_TAG
      : MAT_HORIZONTAL_STEPPER_TAG;

  return new TemplateFactory(mode, tagName, props)
    .ifInternal((me) =>
      me
        .addPropsBoundInputAttribute(consts.NG_SWITCH, VERTICAL_STEPPER)
        .addChild(buildInternalContent())
    )
    .ifExport((me) =>
      me
        .addAttribute(consts.SELECTED_INDEX_ATTR, selectedIndex, false)
        .addChild(buildExportContent(props))
        .if(!props.inputs.verticalStepper, () =>
          me.addAttribute(consts.LABEL_POSITION_ATTR, labelPosition)
        )
    )
    .build();
}

const buildStepper = (tagName: string): TemplateFactory => {
  const mode = cd.TemplateBuildMode.Internal;
  const stepPath = inputPropsBinding(CHILD_PORTALS_INPUT) + wrapInBrackets(INDEX_VAR);
  const stepNamePath = lookupPropAtPath(stepPath, consts.NAME_ATTR);
  const stepIconPath = lookupPropAtPath(stepPath, consts.ICON_ATTR);
  const stepValuePath = lookupPropAtPath(stepPath, consts.VALUE_ATTR);
  const stepDisabledPath = lookupPropAtPath(stepPath, consts.DISABLED_ATTR);
  const portal = buildChildPortal(stepValuePath);

  const step = new TemplateFactory(mode, MAT_STEP)
    .add_ngFor_Attribute(STEP, CHILD_PORTALS_INPUT, true)
    .addBoundAttribute(consts.DISABLED_ATTR, stepDisabledPath)
    .addBoundAttribute(consts.LABEL_ATTR, stepNamePath)
    .addBoundAttribute(consts.STATE_ATTR, stepIconPath)
    .addChild(portal)
    .build();

  const stepper = new TemplateFactory(mode, tagName)
    .addPropsBoundInputAttribute(consts.SELECTED_INDEX_ATTR)
    .addPropsBoundInputAttribute(consts.LABEL_POSITION_ATTR)
    .addOutputBinding(STEP_CHANGE_OUTPUT, consts.SELECTED_INDEX_ATTR, consts.SELECTED_INDEX_ATTR)
    .addChild(step)
    .build();

  const selectedIndexProp = inputPropsBinding(consts.SELECTED_INDEX_ATTR);
  const stepperNgIfWrapper = new TemplateFactory(mode, consts.NG_CONTAINER)
    .add_ngIf_Attribute(`${selectedIndexProp} >= 0`)
    .addChild(stepper)
    .build();

  return new TemplateFactory(mode, consts.DIV_TAG)
    .addDefaultAttributes()
    .addChild(stepperNgIfWrapper);
};

const buildInternalContent = (): string => {
  const verticalStepper = buildStepper(MAT_VERTICAL_STEPPER_TAG).addSwitchDefault().build();
  const horzStepper = buildStepper(MAT_HORIZONTAL_STEPPER_TAG).addSwitchCase(String(false)).build();

  return verticalStepper + horzStepper;
};

const buildExportContent = (props: cd.IStepperProperties): string => {
  return props.inputs.childPortals.reduce((html, portal) => {
    const { value, disabled, name, icon } = portal;
    const stepContent = generateTemplateContent([value as string]);
    const step = new TemplateFactory(cd.TemplateBuildMode.Simple, MAT_STEP)
      .addAttribute(consts.DISABLED_ATTR, disabled, false)
      .addAttribute(consts.LABEL_ATTR, name, false)
      .addAttribute(consts.STATE_ATTR, icon, false)
      .addChild(stepContent)
      .build();

    return html + step;
  }, '');
};
