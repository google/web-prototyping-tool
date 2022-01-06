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
import { Routes, RouterModule } from '@angular/router';
import { ColorPickerDemoComponent } from './demos/color-picker-demo/color-picker-demo.component';
import { FileInputDemoComponent } from './demos/file-input-demo/file-input-demo.component';
import { DataPickerDemoComponent } from './demos/data-picker-demo/data-picker-demo.component';
import { SelectFilterDemoComponent } from './demos/select-filter-demo/select-filter-demo.component';
import { ButtonDemoComponent } from './demos/button-demo/button-demo.component';
import { DndDemoComponent } from './demos/dnd-demo/dnd-demo.component';
import { BoardCreationDemoComponent } from './demos/board-creation-demo/board-creation-demo.component';
import { GenericListPropsDemoComponent } from './demos/generic-list-props-demo/generic-list-props-demo.component';
import { DynamicPropsListGroupDemoComponent } from './demos/dynamic-props-list-group-demo/dynamic-props-list-group-demo.component';
import { DynamicPropsDemoComponent } from './demos/dynamic-props-demo/dynamic-props-demo.component';
import { InputDemoComponent } from './demos/input-demo/input-demo.component';
import { FocusDemoComponent } from './demos/focus-demo/focus-demo.component';
import { ShareDialogDemoComponent } from './demos/share-dialog-demo/share-dialog-demo.component';
import { OverlayDemosComponent } from './demos/overlay-demos/overlay-demos.component';
import { IconPickerDemoComponent } from './demos/icon-picker-demo/icon-picker-demo.component';
import { ToggleButtonGroupDemoComponent } from './demos/toggle-button-group-demo/toggle-button-group-demo.component';
import { LayoutPickerDemoComponent } from './demos/layout-picker-demo/layout-picker-demo.component';
import { LayoutEngineDemoComponent } from './demos/layout-engine-demo/layout-engine-demo.component';
import { PresenceIndicatorsDemoComponent } from './demos/presence-indicators-demo/presence-indicators-demo.component';

export const routes: Routes = [
  { path: 'layout-engine', component: LayoutEngineDemoComponent },
  { path: 'layout-picker', component: LayoutPickerDemoComponent },
  { path: 'presence-indicators', component: PresenceIndicatorsDemoComponent },
  { path: 'dynamic-props', component: DynamicPropsDemoComponent },
  { path: 'data-inputs', component: InputDemoComponent },
  { path: 'drag-n-drop', component: DndDemoComponent },
  { path: 'color-picker', component: ColorPickerDemoComponent },
  { path: 'data-picker', component: DataPickerDemoComponent },
  { path: 'select-filter', component: SelectFilterDemoComponent },
  { path: 'file-input', component: FileInputDemoComponent },
  { path: 'buttons', component: ButtonDemoComponent },
  { path: 'toggle-button-group', component: ToggleButtonGroupDemoComponent },
  { path: 'board-creation', component: BoardCreationDemoComponent },
  { path: 'generic-list-props', component: GenericListPropsDemoComponent },
  { path: 'dynamic-props-list-group', component: DynamicPropsListGroupDemoComponent },
  { path: 'focus-test', component: FocusDemoComponent },
  { path: 'overlays', component: OverlayDemosComponent },
  { path: 'share-dialog', component: ShareDialogDemoComponent },
  { path: 'icon-picker', component: IconPickerDemoComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
