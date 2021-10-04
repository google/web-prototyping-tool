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
import { StyleDirective } from './style.directive';
import { HiddenDirective } from './hidden.directive';
import { TextInjectDirective } from './text-inject.directive';
import { AttrsDirective } from './attrs.directive';
import { CoTooltipDirective } from './co-tooltip.directive';
import { A11yAttrsDirective } from './a11y-attrs.directive';
import { UpdateTagDirective } from './update-tag.directive';

@NgModule({
  declarations: [
    StyleDirective,
    HiddenDirective,
    TextInjectDirective,
    AttrsDirective,
    A11yAttrsDirective,
    CoTooltipDirective,
    UpdateTagDirective,
  ],
  exports: [
    StyleDirective,
    HiddenDirective,
    TextInjectDirective,
    AttrsDirective,
    A11yAttrsDirective,
    CoTooltipDirective,
    UpdateTagDirective,
  ],
})
export class CdDirectiveModule {}
