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

import { IStringMap, IRichTooltip } from 'cd-interfaces';

export enum RequestState {
  Default,
  Loading,
  Error,
}

export const SHEET_ID_HELP_TEXT: IRichTooltip = {
  text: 'The "Sheet Id" is the identifier that links to a specific spreadsheet in Google Sheets.',
  link: 'https://developers.google.com/sheets/api/guides/concepts#spreadsheet_id',
  linkText: 'See more',
};

export const TAB_ID_HELP_TEXT: IRichTooltip = {
  text: 'The name of the tab from the Google sheet.',
};

export const SHEETS_ENDPOINT_BASE = '';
export const SHEETS_ERROR_MESSAGE_REPLACEMENTS: IStringMap<string> = {
  'required AppKey': 'Sheet ID',
  'parse range': 'find tab',
};

export interface SheetsError {
  canonicalCode: string;
  statusMessage: string;
}
export type SheetsResponse =
  | { ok: true; data: IStringMap<any> }
  | { ok: false; error: SheetsError };

export interface ICreateSheetsDataset {
  sheetId: string;
  tabId: string;
  results: IStringMap<any>;
}
