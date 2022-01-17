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
import { distinctUntilChanged, map, auditTime } from 'rxjs/operators';

fromEvent<MessageEvent>(globalThis, 'message')
  .pipe(
    auditTime(100),
    map((item) => item?.data),
    map((data: cd.IOfflineProjectStateMessage) => [
      data.projectId,
      JSON.stringify(data.offlineState),
    ]),
    distinctUntilChanged((x, y) => x[1] === y[1])
  )
  .subscribe(([projectId, offlineState]) => {
    if (!projectId || !offlineState) return;

    setIdbData(projectId, offlineState);
  });
