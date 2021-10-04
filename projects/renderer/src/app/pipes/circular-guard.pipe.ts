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

/**
 * Protects Portals & Symbols from failing due to circular dependencies
 * Used in cd-common/models primitives/portal
 */
@Pipe({ name: 'circularGuardPipe' })
export class CircularGuardPipe implements PipeTransform {
  transform(referenceId: string | undefined, ancestors: string[], renderId: string): boolean {
    return !!referenceId && !ancestors.includes(referenceId) && renderId !== referenceId;
  }
}
