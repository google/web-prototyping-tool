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

import { Component, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { RichTooltipDirective } from 'cd-common';
import { IRichTooltip, ComponentSize } from 'cd-interfaces';

@Component({
  selector: 'app-a11y-help-tooltip',
  templateUrl: './a11y-help-tooltip.component.html',
  styleUrls: ['./a11y-help-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class A11yHelpTooltipComponent {
  @Input() helpText?: IRichTooltip;
  @Input() size: ComponentSize = ComponentSize.Medium;

  @ViewChild(RichTooltipDirective, { static: false }) _helpTextRef?: RichTooltipDirective;

  get helpSlotActive() {
    return this._helpTextRef?.active;
  }

  onHelpClick(e: MouseEvent) {
    const element = e.currentTarget as HTMLElement;
    const bounds = element.getBoundingClientRect();
    this._helpTextRef?.show(bounds);
  }
}
