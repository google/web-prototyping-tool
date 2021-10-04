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
import { MAT_NATIVE_CONTROL } from '../material-shared';

export const MAT_CHIP = 'mat-chip';
export const MAT_CHIP_LIST_TAG = 'mat-chip-list';
export const CHIPS_ATTR = 'chips';
const CHIP_VAR = 'chip';

export default function (mode: cd.TemplateBuildMode, props: cd.IChipListProperties): string {
  return new TemplateFactory(mode, MAT_CHIP_LIST_TAG, props)
    .ifInternal((me) =>
      me
        .addDefaultAttributes()
        .addFitContentClass()
        .addPropsBoundInputAttribute(consts.COLOR_ATTR)
        .addChild(buildInternalContent())
    )
    .ifExport((me) => me.addChild(buildExportContent(props)))
    .build();
}

const buildInternalContent = (): string => {
  const chipText = lookupPropAtPath(CHIP_VAR, consts.NAME_ATTR);
  const content = wrapInCurlyBraces(chipText);
  const disabled = lookupPropAtPath(CHIP_VAR, consts.DISABLED_ATTR); // chip.disabled
  const selected = lookupPropAtPath(CHIP_VAR, consts.SELECTED_ATTR); // chip.selected

  return new TemplateFactory(cd.TemplateBuildMode.Internal, MAT_CHIP)
    .addDirective(MAT_NATIVE_CONTROL)
    .add_ngFor_Attribute(CHIP_VAR, CHIPS_ATTR)
    .addPropsBoundInputAttribute(consts.COLOR_ATTR)
    .addBoundAttribute(consts.DISABLED_ATTR, disabled)
    .addBoundAttribute(consts.SELECTED_ATTR, selected)
    .addOutputEvent('click', `${CHIP_VAR}.value`, CHIPS_ATTR)
    .addChild(content)
    .build();
};

// Create an actual tag for each chip instead of an ngFor
const buildExportContent = (props: cd.IChipListProperties): string => {
  const { chips, color } = props.inputs;
  const chipsHtml: string[] = [];

  for (const chip of chips) {
    const { disabled, name, selected } = chip;
    chipsHtml.push(
      new TemplateFactory(cd.TemplateBuildMode.Simple, MAT_CHIP)
        .addAttribute(consts.COLOR_ATTR, color)
        .addAttribute(consts.DISABLED_ATTR, disabled, false)
        .addAttribute(consts.SELECTED_ATTR, selected, false)
        .addChild(name)
        .build()
    );
  }

  return chipsHtml.join('');
};
