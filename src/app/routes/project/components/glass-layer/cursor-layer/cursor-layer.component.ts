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
import { IUserCursor } from 'cd-interfaces';
import { PresenceService } from 'src/app/services/presence/presence.service';

@Component({
  selector: 'g[app-cursor-layer]',
  templateUrl: './cursor-layer.component.html',
  styleUrls: ['./cursor-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CursorLayerComponent {
  @Input() zoom = 1;
  @Input() darkTheme = false;
  @Input() cursors: IUserCursor[] = [];

  constructor(public presenceService: PresenceService) {}

  trackByFn(_index: number, cursor: IUserCursor) {
    const { zoom } = this;
    const { x, y, z } = cursor.canvas.position;
    return `${cursor.x}-${cursor.y}-${x}-${y}-${z}-${zoom}`;
  }
}
