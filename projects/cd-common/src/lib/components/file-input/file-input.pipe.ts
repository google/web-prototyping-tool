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
import { makePluralFromLength } from 'cd-utils/string';

const NO_FILES_CHOSEN = 'No files chosen';

@Pipe({
  name: 'fileInputLabelFromFilesPipe',
})
export class FileInputLabelFromFilesPipe implements PipeTransform {
  transform(files: File[] | FileList = []): {} {
    const { length } = files;
    if (length === 0) return NO_FILES_CHOSEN;
    if (length > 1) {
      const pluralizedString = makePluralFromLength(`${length} file`, length);
      return `${pluralizedString} chosen`;
    }
    const first = files[0];
    return first.name;
  }
}
