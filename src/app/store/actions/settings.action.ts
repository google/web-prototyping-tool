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

import { Action } from '@ngrx/store';

import { IUserSettings } from 'cd-interfaces';

export const SETTINGS = '[Settings]';
export const SETTINGS_UPDATE = `${SETTINGS} update`;
export const SETTINGS_REMOTE_MODIFIED = `${SETTINGS} remote modified`;
export const SETTINGS_BREAK_GLASS_TOGGLE = `${SETTINGS} Break glass toggle`;

export class SettingsUpdate implements Action {
  readonly type = SETTINGS_UPDATE;
  constructor(public payload: Partial<IUserSettings>) {}
}

export class SettingsRemoteModified implements Action {
  readonly type = SETTINGS_REMOTE_MODIFIED;
  constructor(public payload: IUserSettings) {}
}

export class SettingsBreakGlassToggle implements Action {
  readonly type = SETTINGS_BREAK_GLASS_TOGGLE;
}

export type SettingsAction = SettingsUpdate | SettingsBreakGlassToggle;
