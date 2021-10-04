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
import { DatasetLookupPipe } from './dataset-lookup.pipe';
import { ImageLookupPipe } from './image-lookup.pipe';
import { CircularGuardPipe } from './circular-guard.pipe';
import { ClassPrefixPipePipe } from './class-prefix.pipe';
import { ConditionalAttrPipe } from './conditional-attr.pipe';
import { DataBindingLookupPipe } from './data-binding-lookup.pipe';
import { CoerceBooleanPipe, CoerceNumberPipe, CoerceStringPipe } from './coerce-type.pipe';
import { CssVarPipe } from './css-var.pipe';
import { FullIdPathPipe } from './full-id-path.pipe';
import { IsCloudIconPipe } from './cloud-icon.pipe';
import { CommaStringToArrayPipe } from './string-to-array.pipe';
import { HasValuePipePipe } from './has-value-pipe.pipe';

@NgModule({
  declarations: [
    DatasetLookupPipe,
    ImageLookupPipe,
    ClassPrefixPipePipe,
    CircularGuardPipe,
    ConditionalAttrPipe,
    DataBindingLookupPipe,
    CoerceBooleanPipe,
    CoerceStringPipe,
    CoerceNumberPipe,
    CssVarPipe,
    FullIdPathPipe,
    IsCloudIconPipe,
    CommaStringToArrayPipe,
    HasValuePipePipe,
  ],
  exports: [
    DatasetLookupPipe,
    ImageLookupPipe,
    ClassPrefixPipePipe,
    CircularGuardPipe,
    ConditionalAttrPipe,
    DataBindingLookupPipe,
    CoerceBooleanPipe,
    CoerceStringPipe,
    CoerceNumberPipe,
    CssVarPipe,
    FullIdPathPipe,
    HasValuePipePipe,
    IsCloudIconPipe,
    CommaStringToArrayPipe,
  ],
})
export class RendererPipesModule {}
