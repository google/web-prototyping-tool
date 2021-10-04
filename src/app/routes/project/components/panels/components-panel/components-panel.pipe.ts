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
import * as cd from 'cd-interfaces';

const isSymbolOrCodeComponent = (comp: cd.IComponent | cd.CustomComponent): boolean => {
  return (
    (comp as cd.ISymbolProperties).elementType === cd.ElementEntitySubType.Symbol ||
    (comp as cd.CustomComponent)?.type === cd.EntityType.CodeComponent
  );
};

@Pipe({ name: 'filterByLibraryPipe' })
export class FilterByLibraryPipe implements PipeTransform {
  transform(
    components: Array<cd.IComponent | cd.CustomComponent>,
    activeFilter: cd.ComponentLibrary
  ): Array<cd.IComponent | cd.CustomComponent> {
    if (activeFilter === cd.ComponentLibrary.All) return components;
    if (activeFilter === cd.ComponentLibrary.Custom) {
      return components.filter(isSymbolOrCodeComponent);
    }
    return components.filter((comp) => (comp as cd.IComponent).library === activeFilter);
  }
}
