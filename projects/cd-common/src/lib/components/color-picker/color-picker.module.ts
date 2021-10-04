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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorPickerComponent } from './color-picker.component';

import { IconModule } from '../icon/icon.module';
import { CheckboxModule } from '../checkbox/checkbox.module';
import { InputGroupModule } from '../input-group/input-group.module';
import { OverlayModule } from '../overlay/overlay.module';
import { InputModule } from '../input/input.module';
import { SwatchModule } from '../swatch/swatch.module';
import { SwitchModule } from '../switch/switch.module';
import { ColorSliderModule } from '../color-slider/color-slider.module';
import { ModeToggleButtonModule } from '../mode-toggle-button/mode-toggle-button.module';
import { HsvBoxComponent } from './hsv-box/hsv-box.component';
import { ColorComponent } from './color/color.component';
import { TabGroupModule } from '../tab-group/tab-group.module';
import { SelectInputModule } from '../input/select-input/select-input.module';
import { GradientComponent } from './gradient/gradient.component';
import { TonePickerComponent } from './tone-picker/tone-picker.component';
import { ButtonModule } from '../button/button.module';
import { GradientSelectComponent } from './gradient-select/gradient-select.component';
import { MarkSelectedPipeModule } from 'cd-common/pipes';

@NgModule({
  declarations: [
    ColorPickerComponent,
    HsvBoxComponent,
    ColorComponent,
    GradientComponent,
    TonePickerComponent,
    GradientSelectComponent,
  ],
  imports: [
    CheckboxModule,
    SelectInputModule,
    TabGroupModule,
    ButtonModule,
    ModeToggleButtonModule,
    ColorSliderModule,
    CommonModule,
    IconModule,
    MarkSelectedPipeModule,
    InputGroupModule,
    InputModule,
    OverlayModule,
    SwatchModule,
    SwitchModule,
  ],
  exports: [ColorPickerComponent, GradientSelectComponent],
})
export class ColorPickerModule {}
