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

import { ActivatedRouteSnapshot, RouterStateSnapshot, Params } from '@angular/router';
import { ActionReducerMap, MetaReducer, createSelector } from '@ngrx/store';
import { RouterReducerState, RouterStateSerializer, routerReducer } from '@ngrx/router-store';
import { environment } from 'src/environments/environment';
import { ActionExtension } from 'cd-interfaces';
import * as debugReducer from './debug.reducer';
import * as settingsReducer from './settings.reducer';
import * as userReducer from './user.reducer';
import { Injectable } from '@angular/core';

export interface IRouterStateUrl {
  url: string;
  queryParams: Params;
  params: Params;
  fragment: null | string;
}

export interface IAppState {
  router: RouterReducerState<IRouterStateUrl>;
  user: userReducer.IUserState;
  settings: settingsReducer.ISettingsState;
}

export const reducers: ActionReducerMap<IAppState, ActionExtension> = {
  router: routerReducer,
  settings: settingsReducer.reducer,
  user: userReducer.reducer,
};

export const getRouterState = createSelector(
  (state: IAppState) => state.router,
  (value) => value
);

export const metaReducers: MetaReducer<IAppState, ActionExtension>[] = [
  ...(environment.production ? [] : [debugReducer.exposeState]),
];

/**
 * Takes ActivatedRouteSnapshot and determines what properties from it to put into store
 */
@Injectable()
export class CustomSerializer implements RouterStateSerializer<IRouterStateUrl> {
  serialize(routerState: RouterStateSnapshot): IRouterStateUrl {
    const { url } = routerState;
    const { queryParams, fragment } = routerState.root;

    let state: ActivatedRouteSnapshot = routerState.root;
    while (state.firstChild) {
      state = state.firstChild;
    }
    const { params } = state;

    return { url, queryParams, params, fragment };
  }
}
