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
import { ShadowPropsComponent } from './shadow-props.component';
import { CommonModule } from '@angular/common';
import { PropertyListItemModule } from '../property-list-item/property-list-item.module';
import { ShadowModule } from '../../input/shadow/shadow.module';
import { IconModule } from '../../icon/icon.module';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [ShadowPropsComponent],
  imports: [DragDropModule, CommonModule, PropertyListItemModule, ShadowModule, IconModule],
  exports: [ShadowPropsComponent],
})
export class ShadowPropsModule {}
