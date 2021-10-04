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

import { Pipe, PipeTransform } from '@angular/core';
import { LayerIcons } from 'cd-common/consts';
import { ElementEntitySubType, EntityType } from 'cd-interfaces';

@Pipe({ name: 'outletIconPipe' })
export class OutletIconPipe implements PipeTransform {
  transform(
    id: string,
    elementType?: ElementEntitySubType,
    homeBoardId?: string,
    entityType?: EntityType
  ): string {
    if (entityType === EntityType.CodeComponent) return LayerIcons.Code;
    if (elementType === ElementEntitySubType.Symbol) return LayerIcons.Component;
    return id === homeBoardId ? LayerIcons.Home : LayerIcons.Board;
  }
}
