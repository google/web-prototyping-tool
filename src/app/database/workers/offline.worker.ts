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

/// <reference lib="webworker" />

import type * as cd from 'cd-interfaces';
import { setIdbData } from './indexed-db.utils';
import { fromEvent } from 'rxjs';
import { distinctUntilChanged, map, bufferTime, filter } from 'rxjs/operators';

fromEvent<MessageEvent>(globalThis, 'message')
  .pipe(
    bufferTime(100),
    filter((items) => items.length > 0),
    map((items) => items[items.length - 1]?.data), // always just write last item in buffer
    map((data: cd.IProjectContent) => [data.project.id, JSON.stringify(data)]),
    distinctUntilChanged((x, y) => x[1] === y[1])
  )
  .subscribe(([projectId, projectContent]) => {
    if (!projectId || !projectContent) return;

    setIdbData(projectId, projectContent);
  });
