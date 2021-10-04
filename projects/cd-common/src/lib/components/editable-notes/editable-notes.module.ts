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
import { EditableNotesComponent } from './editable-notes.component';
import { PropertyGroupModule } from '../properties/property-group/property-group.module';
import { ButtonModule } from '../button/button.module';
import { ToggleButtonGroupModule } from '../toggle-button-group/toggle-button-group.module';
import { RichTextEditorModule } from '../rich-text-editor/rich-text-editor.module';
import { InjectedContentModule } from '../injected-content/injected-content.module';

@NgModule({
  declarations: [EditableNotesComponent],
  imports: [
    CommonModule,
    RichTextEditorModule,
    InjectedContentModule,
    PropertyGroupModule,
    ButtonModule,
    ToggleButtonGroupModule,
  ],
  exports: [EditableNotesComponent],
})
export class EditableNotesModule {}
