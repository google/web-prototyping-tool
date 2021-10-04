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

const FILE_SIZE_UNITS = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const;

/**
 * Pretty print file size.
 *
 * Example:
 * 32589   => 31.83 KB
 */
export const prettyPrintFileSize = (fileSizeBytes: number): string => {
  const exponent = Math.floor(Math.log(fileSizeBytes) / Math.log(1024));
  const result = (fileSizeBytes / Math.pow(1024, exponent)).toFixed(2);
  const unit = FILE_SIZE_UNITS[exponent];
  return `${result} ${unit}`;
};
