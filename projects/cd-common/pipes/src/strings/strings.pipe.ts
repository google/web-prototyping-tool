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
import { IStringMap } from 'cd-interfaces';
import { camelCaseToSpaces, capitalizeFirst, kebabToSentenceStyle } from 'cd-utils/string';

const filterForString = <T>(
  items: ReadonlyArray<T>,
  searchString: string,
  filterFunc: (item: T) => boolean
): ReadonlyArray<T> => {
  if (!items) return [];
  if (!searchString || searchString === '') return items;

  searchString = searchString.toLowerCase();

  return items.filter(filterFunc);
};

@Pipe({
  name: 'filterBy',
})
export class FilterByPipe implements PipeTransform {
  transform(
    arr: ReadonlyArray<IStringMap<any>> | undefined,
    props: string[],
    searchString: string = ''
  ): any {
    return arr
      ? filterForString(arr, searchString, (item) =>
          props.some(
            (prop) =>
              !!item[prop] &&
              item[prop].toString().toLowerCase().includes(searchString.toString().toLowerCase())
          )
        )
      : [];
  }
}

@Pipe({
  name: 'camelSpacer',
})
export class CamelSpacerPipe implements PipeTransform {
  transform(text: string): string {
    return camelCaseToSpaces(text);
  }
}

@Pipe({
  name: 'sentenceCase',
})
export class SentenceCasePipe implements PipeTransform {
  transform(text: string): string {
    const lowerCase = text.toLowerCase();
    return capitalizeFirst(lowerCase);
  }
}

@Pipe({
  name: 'kebabToSentence',
})
export class KebabToSentencePipe implements PipeTransform {
  transform(text: string): string {
    const lowerCase = text.toLowerCase();
    return kebabToSentenceStyle(lowerCase);
  }
}
