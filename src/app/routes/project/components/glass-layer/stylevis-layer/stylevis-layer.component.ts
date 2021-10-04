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

import { PropertyModel, RenderRectMap, IRenderResult } from 'cd-interfaces';
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

/**
 * Overlay visuals from css properties like grid or padding
 * on glass layer elements from here
 */
@Component({
  selector: 'g[app-stylevis-layer]',
  templateUrl: './stylevis-layer.component.html',
  styleUrls: ['./stylevis-layer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyleVisLayerComponent {
  private _props: PropertyModel[] = [];
  private _debugMode = false;
  public active = false;

  @Input() outletFrame?: IRenderResult;
  @Input() renderRects: RenderRectMap = new Map();
  @Input() interacting = false;
  @Input() zoom = 1;
  @Input() highlight: ReadonlyArray<string> = [];
  @Input() selection: ReadonlyArray<string> = [];
  @Input() rootId = '';

  @Input()
  set props(props: PropertyModel[]) {
    const [firstProp] = props;
    this.active = !!(firstProp && firstProp.rootId === this.rootId);
    this._props = props;
  }
  get props(): PropertyModel[] {
    return this._props;
  }

  @Input()
  set debug(value: boolean) {
    if (this._debugMode !== value) {
      this._debugMode = value;
    }
  }
}
