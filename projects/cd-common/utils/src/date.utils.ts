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

import dayjs from 'dayjs';
import { isNumber } from 'cd-utils/numeric';
import { isString } from 'cd-utils/string';
import firebase from 'firebase/app';

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

export const isToday = (timestamp: number | dayjs.Dayjs): boolean => {
  const datetimeObj = dayjs(timestamp);
  const now = dayjs(Date.now());
  return datetimeObj.isSame(now, 'day');
};

export const convertTimestampToNumber = (
  timestamp: firebase.firestore.Timestamp | number | string
): number => {
  if (isNumber(timestamp)) return timestamp as number;
  if (isString(timestamp)) return new Date(timestamp as string).getTime();
  const firebaseTimestamp = timestamp as firebase.firestore.Timestamp;
  return new firebase.firestore.Timestamp(
    firebaseTimestamp.seconds,
    firebaseTimestamp.nanoseconds
  ).toMillis();
};

/** Convert date into simplied ISO date string. e.g. 2020-06-15 */
const convertDateToSimpleISOString = (date: Date): string => {
  return dayjs(date).format(DEFAULT_DATE_FORMAT);
};

/** Get today's date as simplied ISO date string. e.g. 2020-06-15 */
export const getTodayAsISOString = (): string => {
  const now = new Date();
  return convertDateToSimpleISOString(now);
};
