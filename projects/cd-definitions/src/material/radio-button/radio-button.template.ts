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

export const MAT_RADIO_GROUP_TAG = 'mat-radio-group';
export const MAT_RADIO_BUTTON = 'mat-radio-button';
const RADIO_BUTTONS = 'radioButtons';
const RADIO = 'radio';

export default function (
  mode: cd.TemplateBuildMode,
  props: cd.IRadioButtonGroupProperties
): string {
  const { color, disabled, labelPosition } = props.inputs;

  return new TemplateFactory(mode, MAT_RADIO_GROUP_TAG, props)
    .ifInternal((me) =>
      me
        .addDefaultAttributes()
        .addFitContentClass()
        .addPropsBoundInputAttribute(consts.COLOR_ATTR)
        .addPropsBoundInputAttribute(consts.DISABLED_ATTR, undefined, true, cd.CoerceValue.Boolean)
        .addPropsBoundInputAttribute(consts.LABEL_POSITION_ATTR)
        .addPropsBoundInputAttribute(consts.VALUE_ATTR)
        .addOutputBinding(consts.CHANGE_OUTPUT_BINDING, consts.VALUE_ATTR, consts.VALUE_ATTR)
        .addChild(buildInternalContent())
    )
    .ifExport((me) =>
      me
        .addAttribute(consts.COLOR_ATTR, color)
        .addAttribute(consts.DISABLED_ATTR, disabled, false)
        .addAttribute(consts.LABEL_POSITION_ATTR, labelPosition)
        .addChild(buildExportContent(props))
    )
    .build();
}

const buildInternalContent = () => {
  const radioText = lookupPropAtPath(RADIO, consts.NAME_ATTR); // radio.name
  const radioDisabled = lookupPropAtPath(RADIO, consts.DISABLED_ATTR); // radio.disabled
  const radioValue = lookupPropAtPath(RADIO, consts.VALUE_ATTR); // radio.value
  const content = wrapInCurlyBraces(radioText);

  return new TemplateFactory(cd.TemplateBuildMode.Internal, MAT_RADIO_BUTTON)
    .add_ngFor_Attribute(RADIO, RADIO_BUTTONS, true)
    .addBoundAttribute(consts.VALUE_ATTR, radioValue)
    .addBoundAttribute(consts.DISABLED_ATTR, radioDisabled)
    .addChild(content)
    .build();
};

// When exporting we create an actual tag for each radio button instead of using an ngFor
const buildExportContent = (props: cd.IRadioButtonGroupProperties): string => {
  const { radioButtons, value } = props.inputs;
  const radioButtonsHtml: string[] = [];
  const selectedIndex = radioButtons.findIndex((item) => item.value === value);
  for (const [index, radio] of radioButtons.entries()) {
    const { disabled, name } = radio;
    const selected = selectedIndex === index;
    radioButtonsHtml.push(
      new TemplateFactory(cd.TemplateBuildMode.Simple, MAT_RADIO_BUTTON)
        .addAttribute(consts.DISABLED_ATTR, disabled, false)
        .addAttribute(consts.CHECKED_ATTR, selected, false)
        .addChild(name)
        .build()
    );
  }

  return radioButtonsHtml.join('');
};
