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
import { ColorPickerDemoComponent } from './color-picker-demo/color-picker-demo.component';
import { CdCommonModule, CdPropertiesModule } from 'cd-common';
import { FileInputDemoComponent } from './file-input-demo/file-input-demo.component';
import { CdCommonPipeModule } from 'cd-common/pipes';
import { DataPickerDemoComponent } from './data-picker-demo/data-picker-demo.component';
import { ButtonDemoComponent } from './button-demo/button-demo.component';
import { SelectFilterDemoComponent } from './select-filter-demo/select-filter-demo.component';
import { OverlayDemosModule } from './overlay-demos/overlay-demos.module';
import { ShareDialogDemoModule } from './share-dialog-demo/share-dialog-demo.module';
import { DndDemoModule } from './dnd-demo/dnd-demo.module';
import { BoardCreationDemoModule } from './board-creation-demo/board-creation-demo.module';
import { GenericListPropsDemoModule } from './generic-list-props-demo/generic-list-props-demo.module';
import { DynamicPropsListGroupDemoModule } from './dynamic-props-list-group-demo/dynamic-props-list-group-demo.module';
import { DynamicPropsDemoModule } from './dynamic-props-demo/dynamic-props-demo.module';
import { InputDemoComponent } from './input-demo/input-demo.component';
import { FocusDemoComponent } from './focus-demo/focus-demo.component';
import { IconPickerDemoComponent } from './icon-picker-demo/icon-picker-demo.component';
import { ToggleButtonGroupDemoComponent } from './toggle-button-group-demo/toggle-button-group-demo.component';
import { LayoutPickerDemoModule } from './layout-picker-demo/layout-picker-demo.module';
import { LayoutEngineModuleDemo } from './layout-engine-demo/layout-engine-demo.module';
import { PresenceIndicatorsDemoModule } from './presence-indicators-demo/presence-indicators-demo.module';

@NgModule({
  declarations: [
    ColorPickerDemoComponent,
    DataPickerDemoComponent,
    SelectFilterDemoComponent,
    FileInputDemoComponent,
    ButtonDemoComponent,
    ToggleButtonGroupDemoComponent,
    InputDemoComponent,
    FocusDemoComponent,
    IconPickerDemoComponent,
  ],
  imports: [
    BoardCreationDemoModule,
    LayoutPickerDemoModule,
    PresenceIndicatorsDemoModule,
    CommonModule,
    LayoutEngineModuleDemo,
    DynamicPropsDemoModule,
    CdCommonModule,
    CdPropertiesModule,
    CdCommonPipeModule,
    DndDemoModule,
    DynamicPropsListGroupDemoModule,
    GenericListPropsDemoModule,
    ShareDialogDemoModule,
    OverlayDemosModule,
  ],
})
export class DemosModule {}
