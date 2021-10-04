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

import { Component, Output, EventEmitter, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-empty-message',
  templateUrl: './empty-message.component.html',
  styleUrls: ['./empty-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyMessageComponent {
  @Input() type: 'horizontal' | 'vertical' = 'horizontal';

  @Input() headerImg!: string;
  @Input() header!: string;
  @Input() description!: string;
  @Input() actionName!: string;
  @Input() actionIcon!: string;

  @Output() action = new EventEmitter<void>();

  onActionClick() {
    this.action.emit();
  }
}
