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
import { InputGroupModule } from '../../input-group/input-group.module';
import { ElementSizePropsComponent } from './element-size-props.component';
import { InputModule } from '../../input/input.module';
import { ButtonModule } from '../../button/button.module';
import { HasPercentPipe, HasPixelsPipe } from './element-size.pipe';

@NgModule({
  declarations: [ElementSizePropsComponent, HasPercentPipe, HasPixelsPipe],
  exports: [ElementSizePropsComponent],
  imports: [InputGroupModule, CommonModule, InputModule, ButtonModule],
})
export class ElementSizePropsModule {}
