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

import * as cd from 'cd-interfaces';
import { select, Store } from '@ngrx/store';
import { withLatestFrom, filter, map } from 'rxjs/operators';
import { getUser } from '../store/selectors';
import { IAppState } from '../store/reducers';
import { OperatorFunction } from 'rxjs';

export function withUser<R>(appStore: Store<IAppState>): OperatorFunction<R, [R, cd.IUser]> {
  return withLatestFrom(
    appStore.pipe(select(getUser)).pipe(
      filter((user) => user !== undefined),
      map((value) => value as cd.IUser)
    )
  );
}
