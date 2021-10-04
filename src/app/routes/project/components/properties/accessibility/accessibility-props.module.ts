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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { AccessibilityPropsComponent } from './accessibility-props.component';
import { AriaOutputComponent } from './aria-output/aria-output.component';
import { AriaInputListComponent } from './aria-input-list/aria-input-list.component';
import { A11yCustomAttrsComponent } from './a11y-custom-attrs/a11y-custom-attrs.component';
import { A11yHelpTooltipComponent } from './a11y-help-tooltip/a11y-help-tooltip.component';

import {
  DisabledAttrPipe,
  SomeAttrsDisabledPipe,
  AttrMenuDataPipe,
  AttrValueTypePipe,
  IsNumberTypeInputPipe,
  ShowHiddenAttrPipe,
  GetSelectResetState,
  MenuForAttrKeyPipe,
  AttrHelpTooltipPipe,
  DefaultsHelpTooltipPipe,
} from './accessibility-props.pipe';
import { CdCommonModule, CdPropertiesModule } from 'cd-common';

@NgModule({
  declarations: [
    AccessibilityPropsComponent,
    AriaOutputComponent,
    AriaInputListComponent,
    A11yCustomAttrsComponent,
    A11yHelpTooltipComponent,
    DisabledAttrPipe,
    SomeAttrsDisabledPipe,
    AttrMenuDataPipe,
    AttrValueTypePipe,
    IsNumberTypeInputPipe,
    ShowHiddenAttrPipe,
    GetSelectResetState,
    MenuForAttrKeyPipe,
    AttrHelpTooltipPipe,
    DefaultsHelpTooltipPipe,
  ],
  imports: [CommonModule, CdCommonModule, CdPropertiesModule, CdCommonPipeModule],
  exports: [AccessibilityPropsComponent],
})
export class AccessibilityPropsModule {}
