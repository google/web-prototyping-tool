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
 * Compute full ID path to an element based off of elementId, ancestor ids, and instanceId.
 * The root board id is not included in the path.
 *
 * For example: if an element1 is a child of group1 inside of board1, its id path would be:
 *
 * group1-element1
 *
 *
 * If the element is inside a of a symbol or portal instance, it prefixes the id path with the
 * instance id wrapped in brackets.
 *
 * For example: If a portal1 was projecting board1 from the example above, the full id path to
 * the instance of element1 inside of portal1 would be:
 *
 * [portal1]-board1-group1-element1
 */
@Pipe({ name: 'fullIdPathPipe' })
export class FullIdPathPipe implements PipeTransform {
  transform(id: string, ancestors?: string[]): string | undefined {
    if (!ancestors?.length) return id;
    return `${ancestors.join('-')}-${id}`;
  }
}
