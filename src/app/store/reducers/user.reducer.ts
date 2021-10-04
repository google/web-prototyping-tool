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

import * as UserActions from '../actions/user.action';
import { IReducerFunctionLookup, IUser } from 'cd-interfaces';

export interface IUserState {
  user?: IUser;
  isAdmin: boolean;
}

export const initialState: IUserState = { isAdmin: false };

function handleGetUserSuccess(
  state: IUserState,
  action: UserActions.AppGetUserSuccess
): IUserState {
  return {
    ...state,
    user: action.payload,
  };
}

function handleSignOutUserSuccess(
  state: IUserState,
  _action: UserActions.AppGetUserSuccess
): IUserState {
  const updatedState = { ...state };
  delete updatedState.user;
  return updatedState;
}

function handleSetAdminUser(
  state: IUserState,
  { isAdmin }: UserActions.AppSetAdminUser
): IUserState {
  return { ...state, isAdmin };
}

/**
 *
 */
const lookup: IReducerFunctionLookup = {
  [UserActions.APP_SIGN_IN_USER_SUCCESS]: handleGetUserSuccess,
  [UserActions.APP_GET_USER_SUCCESS]: handleGetUserSuccess,
  [UserActions.APP_SIGN_OUT_USER_SUCCESS]: handleSignOutUserSuccess,
  [UserActions.APP_SET_ADMIN_USER]: handleSetAdminUser,
};

export function reducer(state = initialState, action: UserActions.UserAction): IUserState {
  return lookup[action.type] ? lookup[action.type](state, action) : state;
}
