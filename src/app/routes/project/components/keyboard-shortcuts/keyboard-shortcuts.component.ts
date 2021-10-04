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

import { Component, ChangeDetectionStrategy, AfterViewInit, ViewChild } from '@angular/core';
import {
  AbstractOverlayContentDirective,
  OverlayInitService,
  ScrollViewComponent,
} from 'cd-common';
import * as utils from './keyboard-shortcuts.utils';

@Component({
  selector: 'app-keyboard-shortcuts',
  templateUrl: './keyboard-shortcuts.component.html',
  styleUrls: ['./keyboard-shortcuts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardShortcutsComponent
  extends AbstractOverlayContentDirective
  implements AfterViewInit
{
  public shortcutSections: utils.IShortcutSection[];

  @ViewChild('scrollView', { read: ScrollViewComponent, static: true })
  _scrollViewRef!: ScrollViewComponent;

  constructor(_overlayInit: OverlayInitService) {
    super(_overlayInit);
    this.shortcutSections = utils.convertConfigsToShortcutSections(utils.shortcutConfig);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();

    // TEMP Fix for showing scrollview shadow
    setTimeout(this._scrollViewRef.onScroll);
  }

  onDismissClicked() {
    this.dismissOverlay.emit();
  }
}
