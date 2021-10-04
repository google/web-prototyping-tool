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

import { Component, ChangeDetectionStrategy, Input, HostBinding } from '@angular/core';

import { EmbedBadgePosition, PreviewAnalyticsParam } from 'cd-interfaces';

@Component({
  selector: 'app-embed-badge',
  templateUrl: './embed-badge.component.html',
  styleUrls: ['./embed-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbedBadgeComponent {
  PreviewAnalyticsParam = PreviewAnalyticsParam;

  @Input() projectLink = '/';
  @Input() position = EmbedBadgePosition.TopRight;

  @HostBinding('class.right')
  get anchoredRight(): boolean {
    return (
      this.position === EmbedBadgePosition.BottomRight ||
      this.position === EmbedBadgePosition.TopRight
    );
  }

  @HostBinding('class.left')
  get anchoredLeft(): boolean {
    return (
      this.position === EmbedBadgePosition.BottomLeft ||
      this.position === EmbedBadgePosition.TopLeft
    );
  }

  @HostBinding('class.top')
  get anchoredTop(): boolean {
    return (
      this.position === EmbedBadgePosition.TopLeft || this.position === EmbedBadgePosition.TopRight
    );
  }

  @HostBinding('class.bottom')
  get anchoredBottom(): boolean {
    return (
      this.position === EmbedBadgePosition.BottomLeft ||
      this.position === EmbedBadgePosition.BottomRight
    );
  }
}
