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

import {
  Component,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  AfterViewInit,
} from '@angular/core';
import { OverlayInitService } from 'cd-common';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-layout-picker',
  templateUrl: './layout-picker.component.html',
  styleUrls: ['./layout-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPickerComponent implements AfterViewInit {
  @Output() selectLayout = new EventEmitter<cd.ILayoutDefinition>();

  constructor(private _overlayInit: OverlayInitService) {}

  ngAfterViewInit() {
    this._overlayInit.componentLoaded();
  }

  onLayoutSelect(layout: cd.ILayoutDefinition) {
    this.selectLayout.emit(layout);
  }
}
