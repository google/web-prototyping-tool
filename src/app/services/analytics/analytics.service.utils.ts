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

import firebase from 'firebase/app';
import * as cd from 'cd-interfaces';
import { createId } from 'cd-utils/guid';

const EMPTY_MESSAGE = 'empty message';

const generateMessageHash = (message: string) => {
  return String(
    message.split('').reduce((acc, char) => {
      acc = (acc << 5) - acc + char.charCodeAt(0);
      return acc & acc;
    }, 0)
  );
};

export const createAnalyticsErrorEntry = (
  message: string = EMPTY_MESSAGE,
  stack?: string
): cd.IExceptionEvent => {
  const id = createId();
  const nowUnixTimestamp = new Date().getTime();
  const createdAt = firebase.firestore.Timestamp.fromMillis(nowUnixTimestamp);
  const { location } = window;
  const { pathname, search } = location;
  const url = pathname + search;
  const messageHash = generateMessageHash(message + (stack || ''));
  const exception: cd.IExceptionEvent = { id, url, message, messageHash, createdAt };
  if (stack) exception.stack = stack;
  return exception;
};
