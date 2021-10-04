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

import { ActionReducer, Action } from '@ngrx/store';
import { setGlobal } from 'src/app/services/debug/debug.utils';
import { IAppState } from './';

const EXPOSED_STATE = 'appState';

export function exposeState(
  reducer: ActionReducer<IAppState, Action>
): ActionReducer<IAppState, Action> {
  return (state: IAppState | undefined, action: Action): IAppState => {
    const result = reducer(state, action);
    setGlobal(EXPOSED_STATE, result);
    return result;
  };
}
