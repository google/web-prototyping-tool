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

import { toBase62, BASE_62_CHARS } from 'cd-utils/numeric';

const DEFAULT_ID_LENGTH = 20;

export const generateIDWithLength = (length = DEFAULT_ID_LENGTH): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let id = '';
  for (let i = 0; i < bytes.length; i++) {
    id += BASE_62_CHARS.charAt(bytes[i] % BASE_62_CHARS.length);
  }

  return id;
};

/**
 * This function generates a monotonically increasing id by using a timestamp as part of the id.
 *
 * Timestamp is converted to base 62, then random additional characters are appended to provide
 * a consistent id length of 20
 */
export const createId = (): string => {
  const timestamp = Date.now();
  const timestampBase62 = toBase62(timestamp);
  const remainingChars = generateIDWithLength(DEFAULT_ID_LENGTH - timestampBase62.length);
  return `${timestampBase62}${remainingChars}`;
};
