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
import { DynamicPropsDemoComponent } from './dynamic-props-demo.component';
import { CdCommonModule } from 'cd-common';
import { DynamicPropertiesModule } from 'src/app/routes/project/components/properties/dynamic-properties/dynamic-properties.module';
import { Store, StoreModule } from '@ngrx/store';
import { InteractionService } from 'src/app/routes/project/services/interaction/interaction.service';
import { AssetsService } from 'src/app/routes/project/services/assets/assets.service';
import { SelectionContextService } from 'src/app/routes/project/services/selection-context/selection.context.service';

class InteractionServiceMock {
  renderRectsForIds() {
    return new Map();
  }
}
class AssetServiceMock {}
class SelectionContextMock {}

@NgModule({
  declarations: [DynamicPropsDemoComponent],
  providers: [
    Store,
    { provide: InteractionService, useClass: InteractionServiceMock },
    { provide: AssetsService, useClass: AssetServiceMock },
    { provide: SelectionContextService, useClass: SelectionContextMock },
  ],
  imports: [CommonModule, CdCommonModule, DynamicPropertiesModule, StoreModule.forRoot({})],
})
export class DynamicPropsDemoModule {}
