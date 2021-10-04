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
import { NavigationExtras } from '@angular/router';
import { APP } from './user.action';

export const APP_GO = `${APP} Go`;
export const APP_GO_TO_PREVIEW = `${APP} Go to preview`;
export const APP_BACK = `${APP} Back`;
export const APP_FORWARD = `${APP} Forward`;

export interface IGoPayload {
  path: any[];
  query?: object;
  extras?: NavigationExtras;
}

export class AppGo implements Action {
  readonly type = APP_GO;
  constructor(public payload: IGoPayload) {}
}

export class AppGoToPreview implements Action {
  readonly type = APP_GO_TO_PREVIEW;
  constructor(public rootId?: string, public showComments = false) {}
}

export class AppBack implements Action {
  readonly type = APP_BACK;
}

export class AppForward implements Action {
  readonly type = APP_FORWARD;
}

export type Actions = AppGo | AppGoToPreview | AppBack | AppForward;
