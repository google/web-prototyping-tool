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
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
dayjs.extend(utc);

/**
 * Fixes an issue with Angular Material's date picker
 * where a date value such as 2021-03-05 is based off GMT and needs the current UTC offset
 */
@Pipe({ name: 'matDateFix' })
export class DateFixPipe implements PipeTransform {
  transform(value: string | undefined): string {
    return value ? dayjs(value).utc().local().format() : '';
  }
}
