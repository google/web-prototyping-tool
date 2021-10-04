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

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IconPickerService } from 'cd-common';
import { ICON_DATA_SRC } from 'cd-common/consts';
import * as cd from 'cd-interfaces';

@Component({
  selector: 'app-icon-picker-demo',
  template: `
    <div class="container">
      <cd-icon-picker [activeIcon]="pickerValue1" (pick)="onPickIcon1($event)"></cd-icon-picker>

      <div class="output">
        <b>All icons mode</b>
        <pre [innerHTML]="format(pickerValue1)"></pre>
      </div>
    </div>

    <div class="container">
      <cd-icon-picker
        [activeIcon]="pickerValue2"
        [mode]="IconPickerMode.MaterialOnly"
        (pick)="onPickIcon2($event)"
      ></cd-icon-picker>

      <div class="output">
        <b>Material icons only</b>
        <pre [innerHTML]="format(pickerValue2)"></pre>
      </div>
    </div>

    <div class="container">
      <cd-icon-picker
        [activeIcon]="pickerValue3"
        [mode]="IconPickerMode.Only"
        (pick)="onPickIcon3($event)"
      ></cd-icon-picker>

      <div class="output">
        <b>Cloud Platform icons only</b>
        <pre [innerHTML]="format(pickerValue3)"></pre>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
      }

      .container {
        position: relative;
      }

      .output {
        position: absolute;
        top: 0;
        left: 255px;
        font-size: 12px;
        line-height: 24px;
      }

      pre {
        padding: 1px 2px;
        background-color: #eee;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPickerDemoComponent {
  public pickerValue1: cd.SelectedIcon = {
    name: 'security-checkup-yellow',
    iconset: 'shell',
    size: cd.IconSize.Small,
  };
  public pickerValue2: cd.SelectedIcon = 'indeterminate_check_box';
  public pickerValue3: cd.SelectedIcon = {
    name: 'MAPS_SECTION',
    iconset: 'maps',
    size: cd.IconSize.Large,
  };

  public IconPickerMode = cd.IconPickerMode;

  constructor(iconPickerService: IconPickerService) {
    iconPickerService.loadMaterialIconData(ICON_DATA_SRC);
  }

  onPickIcon1(icon: string | cd.IIconConfig) {
    this.pickerValue1 = icon;
  }

  onPickIcon2(icon: string | cd.IIconConfig) {
    this.pickerValue2 = icon;
  }

  onPickIcon3(icon: string | cd.IIconConfig) {
    this.pickerValue3 = icon;
  }

  format = (value: string | cd.IIconConfig): string => {
    return JSON.stringify(value, null, 2);
  };
}
