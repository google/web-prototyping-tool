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

import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Position } from 'cd-interfaces';
@Component({
  selector: 'cd-fullscreen-button',
  templateUrl: './fullscreen-button.component.html',
  styleUrls: ['./fullscreen-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenButtonComponent {
  @Input() disabled = false;
  @Input() fullscreen = false;
  @Input() expandIcon = 'open_in_full';
  @Input() collapseIcon = 'close_fullscreen';
  @Input() activeTooltip = 'Exit fullscreen';
  @Input() inactiveTooltip = 'Fullscreen';
  @Input() tooltipDirection: Position = Position.Top;
  @Output() fullscreenChange = new EventEmitter<boolean>();

  get tooltip() {
    return this.fullscreen ? this.activeTooltip : this.inactiveTooltip;
  }

  onFullScreenToggle() {
    this.fullscreenChange.emit(!this.fullscreen);
  }
}
