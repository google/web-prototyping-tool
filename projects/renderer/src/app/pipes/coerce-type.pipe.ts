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

import { isBoolean } from 'cd-utils/object';
import { isNumber } from 'cd-utils/numeric';
import { isString } from 'cd-utils/string';

const coerceString = (value: any): string => {
  if (isString(value)) return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

const coerceNumber = (value: any): number => {
  if (isNumber(value)) return value;
  return Number(value);
};

const coerceBoolean = (value: any): boolean => {
  if (isBoolean(value)) return value;
  if (String(value) === 'false') return false;
  return !!value;
};

/**
 * These pipes will convert the inputValue into the specified type e.g. string, number, boolean
 */

@Pipe({ name: 'coerceBooleanPipe' })
export class CoerceBooleanPipe implements PipeTransform {
  transform(inputValue: any): any | undefined {
    return coerceBoolean(inputValue);
  }
}

@Pipe({ name: 'coerceStringPipe' })
export class CoerceStringPipe implements PipeTransform {
  transform(inputValue: any): any | undefined {
    return coerceString(inputValue);
  }
}

@Pipe({ name: 'coerceNumberPipe' })
export class CoerceNumberPipe implements PipeTransform {
  transform(inputValue: any): any | undefined {
    return coerceNumber(inputValue);
  }
}
