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
import { IProjectState } from '../store/reducers';
import { getDesignSystem, getDesignSystemDocument } from '../store/selectors';
import { withLatestFrom, map, filter } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { OperatorFunction } from 'rxjs';

export function withDesignSystem<R>(
  projectStore: Store<IProjectState>
): OperatorFunction<R, [R, cd.IDesignSystemDocument]> {
  return withLatestFrom(
    projectStore.pipe(select(getDesignSystem)).pipe(
      filter((designSystem) => designSystem !== undefined),
      map((value) => value as cd.IDesignSystemDocument)
    )
  );
}

export function withDesignSystemDoc<R>(
  projectStore: Store<IProjectState>
): OperatorFunction<R, [R, cd.IDesignSystemDocument]> {
  return withLatestFrom(
    projectStore.pipe(select(getDesignSystemDocument)).pipe(
      filter((designSystemDoc) => designSystemDoc !== undefined),
      map((value) => value as cd.IDesignSystemDocument)
    )
  );
}
