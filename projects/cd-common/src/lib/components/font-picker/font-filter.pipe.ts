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
import { IFontFamily } from 'cd-interfaces';
@Pipe({
  name: 'FontFilter',
})
export class FontFilterPipe implements PipeTransform {
  transform(
    families: ReadonlyArray<IFontFamily>,
    filter: string,
    existingFonts: ReadonlyArray<IFontFamily>
  ): ReadonlyArray<IFontFamily> {
    if (!families) return [];

    const query = filter.toLowerCase();
    return families.filter(({ family }) => {
      const exists = existingFonts.findIndex((font) => font.family === family) === -1;
      return exists && family.toLowerCase().includes(query);
    });
  }
}
