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

export const SHEETS_BASE_URL = 'docs.google.com/spreadsheets/d/';
export const SHEETS_ID_REGEX = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/g;
export const DEFAULT_GOOGLE_SHEET = `https://${SHEETS_BASE_URL}1AtOhhHi2Z5iKUxRWmGpDG339oWhLGEZ14mt5dPuyzHU/htmlembed`;

export enum SheetsParam {
  Widget = 'widget',
  Headers = 'headers',
  TableId = 'gid',
  Title = 'chrome',
}
