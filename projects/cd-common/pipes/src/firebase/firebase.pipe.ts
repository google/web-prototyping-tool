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
import type firebase from 'firebase/app';
import dayjs from 'dayjs';
import { isToday, convertTimestampToNumber } from 'cd-common/utils';

const TODAY_DATE_FORMAT = 'h:mm A';
const DEFAULT_DATE_FORMAT = 'MMM D, YYYY';

@Pipe({ name: 'FormatFirebaseTime' })
export class FormatFirebaseTime implements PipeTransform {
  transform(
    timestamp: firebase.firestore.Timestamp | number | string | undefined,
    ignoreTime?: any
  ): string | undefined {
    if (!timestamp) return;
    const datetime = convertTimestampToNumber(timestamp);
    const datetimeObj = dayjs(datetime);
    const updatedToday = isToday(datetimeObj);
    const showTime = !ignoreTime && updatedToday;
    const dateFormat = showTime ? TODAY_DATE_FORMAT : DEFAULT_DATE_FORMAT;
    return datetimeObj.format(dateFormat);
  }
}
