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

import { ChangeDetectionStrategy, Component, Input, HostBinding } from '@angular/core';
import { SpinnerMode } from 'cd-common/consts';
import { ComponentSize } from 'cd-interfaces';

@Component({
  selector: 'cd-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  @Input() size: ComponentSize = ComponentSize.Medium;
  @Input() mode = SpinnerMode.Indeterminate;

  @HostBinding('class.small')
  get getSmallSpinner() {
    return this.size === ComponentSize.Small;
  }

  @HostBinding('class.large')
  get getLargeSpinner() {
    return this.size === ComponentSize.Large;
  }
}
