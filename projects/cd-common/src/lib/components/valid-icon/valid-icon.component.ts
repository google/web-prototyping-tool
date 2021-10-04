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

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

const VALID_ICON = 'check';
const INVALID_ICON = 'warning';

@Component({
  selector: 'cd-valid-icon',
  templateUrl: './valid-icon.component.html',
  styleUrls: ['./valid-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidIconComponent {
  @Input() isValid = true;
  @Input() showText = true;
  @Input() showWhenValid = true;

  @Input() validText = 'Valid';
  @Input() invalidText = 'Invalid';

  get canShow() {
    return this.showWhenValid ? true : !this.isValid;
  }

  get text() {
    return this.isValid ? this.validText : this.invalidText;
  }

  get icon() {
    return this.isValid ? VALID_ICON : INVALID_ICON;
  }
}
