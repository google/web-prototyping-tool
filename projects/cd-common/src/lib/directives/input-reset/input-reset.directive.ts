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

import { Directive, HostBinding } from '@angular/core';
const OFF_VALUE = 'off';
@Directive({
  selector: '[cdInputReset]',
})
export class InputResetDirective {
  @HostBinding('attr.autocorrect') autocorrect = OFF_VALUE;
  @HostBinding('attr.autocomplete') autocomplete = OFF_VALUE;
  @HostBinding('attr.autocapitalize') autocapitalize = OFF_VALUE;
  @HostBinding('attr.spellcheck') spellcheck = false;
}
