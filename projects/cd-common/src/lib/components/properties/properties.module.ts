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
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  PropertiesComponent,
  PropertiesHeaderLeftDirective,
  PropertiesActionsSlotDirective,
  PropertiesCodeSlotDirective,
  PropertiesA11ySlotDirective,
} from './properties.component';
import { ScrollViewModule } from '../scroll-view/scroll-view.module';
import { MeasuredTextModule } from '../measured-text/measured-text.module';
import { InputResetModule } from '../../directives/input-reset/input-reset.module';
import { AdvancedPropsModule } from './advanced-props/advanced-props.module';
import { ButtonModule } from '../button/button.module';
import { CommonModule } from '@angular/common';
import { InputModule } from '../input/input.module';
import { InputGroupModule } from '../input-group/input-group.module';
import { PropertyGroupModule } from './property-group/property-group.module';
import { TextStylePropsModule } from './text-style-props/text-style-props.module';
import { GenericPropListModule } from './generic-prop-list/generic-prop-list.module';
import { ToggleButtonGroupModule } from '../toggle-button-group/toggle-button-group.module';
import { TabGroupModule } from '../tab-group/tab-group.module';
import { MenuButtonModule } from '../menu-button/menu-button.module';
import { InitialSizePropsComponent } from './initial-size-props/initial-size-props.component';
import { IconModule } from '../icon/icon.module';
import { AdvancedElementPropsModule } from './advanced-element-props/advanced-element-props.module';
import { AdvancedTextPropsModule } from './advanced-text-props/advanced-text-props.module';
import { BackgroundPropsModule } from './background-props/background-props.module';
import { BoardSizeModule } from './board-size-props/board-size.module';
import { EdgePropsModule } from './edge-props/edge-props.module';
import { ElementSizePropsModule } from './element-size-props/element-size-props.module';
import { FontPropsModule } from './font-props/font-props.module';
import { IconPropsModule } from './icon-props/icon-props.module';
import { PropertyListItemModule } from './property-list-item/property-list-item.module';
import { ShadowPropsModule } from './shadow-props/shadow-props.module';

@NgModule({
  declarations: [
    PropertiesComponent,
    PropertiesHeaderLeftDirective,
    PropertiesCodeSlotDirective,
    PropertiesA11ySlotDirective,
    PropertiesActionsSlotDirective,
    InitialSizePropsComponent,
  ],
  imports: [
    AdvancedPropsModule,
    ButtonModule,
    CommonModule,
    DragDropModule,
    GenericPropListModule,
    InputGroupModule,
    InputModule,
    InputResetModule,
    MeasuredTextModule,
    MenuButtonModule,
    PropertyGroupModule,
    ScrollViewModule,
    TabGroupModule,
    TextStylePropsModule,
    ToggleButtonGroupModule,
    IconModule,
  ],
  exports: [
    PropertiesComponent,
    PropertiesHeaderLeftDirective,
    PropertiesActionsSlotDirective,
    PropertiesA11ySlotDirective,
    InitialSizePropsComponent,
    GenericPropListModule,
    PropertyGroupModule,
    AdvancedPropsModule,
    AdvancedTextPropsModule,
    AdvancedElementPropsModule,
    ShadowPropsModule,
    PropertyListItemModule,
    IconPropsModule,
    BackgroundPropsModule,
    BoardSizeModule,
    EdgePropsModule,
    FontPropsModule,
    ElementSizePropsModule,
  ],
})
export class CdPropertiesModule {}
