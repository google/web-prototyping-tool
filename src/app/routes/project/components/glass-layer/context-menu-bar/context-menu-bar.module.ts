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
import { AddComponentModalComponent } from './add-component/add-component-context.component';
import { ComponentsListModalComponent } from './components-list/components-list-modal.component';
import { ReplaceComponentModalComponent } from './replace-component/replace-component-context.component';
import { ActionsListModalComponent } from './actions-list/actions-list-modal.component';
import { ContextMenuBarComponent } from './context-menu-bar.component';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { CdCommonModule } from 'cd-common';
import { LayoutPickerModule } from '../../layout-picker/layout-picker.module';
import { LayoutPickerContextComponent } from './layout-picker-context/layout-picker-context.component';

@NgModule({
  declarations: [
    ContextMenuBarComponent,
    AddComponentModalComponent,
    ComponentsListModalComponent,
    ReplaceComponentModalComponent,
    ActionsListModalComponent,
    LayoutPickerContextComponent,
  ],
  imports: [CommonModule, CdCommonModule, CdCommonPipeModule, LayoutPickerModule],
  exports: [ContextMenuBarComponent],
})
export class ContextMenuBarModule {}
