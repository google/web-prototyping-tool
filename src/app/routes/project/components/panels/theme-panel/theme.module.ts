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
import { ThemePanelComponent } from './theme-panel.component';
import { FontEditorComponent } from './components/font-editor/font-editor.component';
import { FontFamilyComponent } from './components/font-family/font-family.component';
import { ThemeColorComponent } from './components/theme-color/theme-color.component';
import { ThemeIconStylesComponent } from './components/theme-icon-styles/theme-icon-styles.component';
import { ThemeVariablesComponent } from './components/theme-variables/theme-variables.component';
import { VariableEditorComponent } from './components/variable-editor/variable-editor.component';
import { TypeRampComponent } from './components/type-ramp/type-ramp.component';
import { ActivityPanelHeaderModule } from '../../panel-header/activity-panel-header.module';
import { ThemeColorSwatchComponent } from './components/theme-color-swatch/theme-color-swatch.component';
import { FontPipeModule } from 'cd-common/pipes';
import { CdCommonModule, FontPropsModule } from 'cd-common';

@NgModule({
  declarations: [
    ThemePanelComponent,
    FontEditorComponent,
    VariableEditorComponent,
    ThemeVariablesComponent,
    FontFamilyComponent,
    ThemeColorComponent,
    ThemeIconStylesComponent,
    TypeRampComponent,
    ThemeColorSwatchComponent,
  ],
  imports: [
    CommonModule,
    CdCommonModule,
    FontPipeModule,
    FontPropsModule,
    ActivityPanelHeaderModule,
  ],
  exports: [ThemePanelComponent],
})
export class ThemeModule {}
