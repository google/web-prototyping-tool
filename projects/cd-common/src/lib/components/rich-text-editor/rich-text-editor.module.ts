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
import { ObserversModule } from '@angular/cdk/observers';
import { CommonModule } from '@angular/common';
import { RichTextEditorComponent } from './rich-text-editor.component';
import { ButtonModule } from '../button/button.module';
import { MenuButtonModule } from '../menu-button/menu-button.module';
import { InputModule } from '../input/input.module';
import { ToggleButtonGroupModule } from '../toggle-button-group/toggle-button-group.module';
import { InputGroupModule } from '../input-group/input-group.module';
import { ResizeWrapperModule } from './resize-wrapper/resize-wrapper.module';
import { LinkOverlayModule } from './link-overlay/link-overlay.module';
import { TextAlignmentComponent } from './text-alignment/text-alignment.component';
import { TextJustifyComponent } from './text-justify/text-justify.component';
import { DataPickerModule } from '../data-picker/data-picker.module';

@NgModule({
  declarations: [RichTextEditorComponent, TextAlignmentComponent, TextJustifyComponent],
  imports: [
    ObserversModule,
    CommonModule,
    ButtonModule,
    DataPickerModule,
    MenuButtonModule,
    InputModule,
    ToggleButtonGroupModule,
    InputGroupModule,
    ResizeWrapperModule,
    LinkOverlayModule,
  ],
  exports: [RichTextEditorComponent],
})
export class RichTextEditorModule {}
