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
import { IUser } from 'cd-interfaces';

export const APP = '[App]';
export const APP_GET_USER = `${APP} Get user`;
export const APP_GET_USER_WITH_TOKEN = `${APP} Get user with token`;
export const APP_GET_USER_SUCCESS = `${APP} Get user success`;
export const APP_GET_USER_FAIL = `${APP} Get user fail`;
export const APP_SET_USER = `${APP} Set user`;
export const APP_SET_ADMIN_USER = `${APP} Set admin user`;

export const APP_SIGN_IN_USER = `${APP} Sign in user`;
export const APP_SIGN_IN_USER_SUCCESS = `${APP} Sign in user success`;
export const APP_SIGN_IN_USER_FAIL = `${APP} Sign in user fail`;

export const APP_SIGN_OUT_USER = `${APP} Sign out user`;
export const APP_SIGN_OUT_USER_SUCCESS = `${APP} Sign out user success`;
export const APP_SIGN_OUT_USER_FAIL = `${APP} Sign out user fail`;

export class AppGetUser implements Action {
  readonly type = APP_GET_USER;
}

export class AppGetUserWithToken implements Action {
  readonly type = APP_GET_USER_WITH_TOKEN;
  constructor(public token: string) {}
}

export class AppGetUserSuccess implements Action {
  readonly type = APP_GET_USER_SUCCESS;
  constructor(public payload: IUser) {}
}

export class AppGetUserFail implements Action {
  readonly type = APP_GET_USER_FAIL;
  constructor(public payload: any) {}
}

export class AppSetUser implements Action {
  readonly type = APP_SET_USER;
  constructor(public payload: IUser) {}
}

export class AppSignInUser implements Action {
  readonly type = APP_SIGN_IN_USER;
  constructor(public token: string) {}
}

export class AppSignInUserSuccess implements Action {
  readonly type = APP_SIGN_IN_USER_SUCCESS;
  constructor(public payload: IUser) {}
}

export class AppSignInUserFail implements Action {
  readonly type = APP_SIGN_IN_USER_FAIL;
  constructor(public payload: any) {}
}

export class AppSignOutUser implements Action {
  readonly type = APP_SIGN_OUT_USER;
}

export class AppSignOutUserSuccess implements Action {
  readonly type = APP_SIGN_OUT_USER_SUCCESS;
  constructor() {}
}

export class AppSignOutUserFail implements Action {
  readonly type = APP_SIGN_OUT_USER_FAIL;
  constructor() {}
}

export class AppSetAdminUser implements Action {
  readonly type = APP_SET_ADMIN_USER;
  constructor(public isAdmin: boolean) {}
}

export type UserAction =
  | AppGetUser
  | AppGetUserWithToken
  | AppGetUserFail
  | AppGetUserSuccess
  | AppSetUser
  | AppSignInUser
  | AppSignInUserFail
  | AppSignInUserSuccess
  | AppSignOutUser
  | AppSignOutUserFail
  | AppSignOutUserSuccess
  | AppSetAdminUser;
