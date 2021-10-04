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
import * as cd from 'cd-interfaces';
import { copyToClipboard } from 'cd-utils/clipboard';
import { generateComputedCSS, cssToString } from 'cd-common/utils';

@Component({
  selector: 'cd-computed-css',
  templateUrl: './computed-css.component.html',
  styleUrls: ['./computed-css.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComputedCssComponent {
  private _designSystem?: cd.IDesignSystem;
  private _projectAssets?: cd.AssetMap;
  private _styles?: cd.IStyleAttributes;

  public computed: ReadonlyArray<cd.IStyleList> = [];

  @Input()
  set designSystem(value: cd.IDesignSystem) {
    this._designSystem = value;
    this.computeCSS();
  }
  @Input()
  set projectAssets(value: cd.AssetMap) {
    this._projectAssets = value;
    this.computeCSS();
  }
  @Input()
  set styles(value: cd.IStyleAttributes) {
    this._styles = value;
    this.computeCSS();
  }

  onCopy(styles: cd.IStyleList) {
    const content = cssToString(styles);
    copyToClipboard(content);
  }

  computeCSS() {
    const { _designSystem, _projectAssets, _styles } = this;
    if (!_designSystem || !_projectAssets || !_styles) return;
    this.computed = generateComputedCSS(_styles, _designSystem, _projectAssets);
  }
}
