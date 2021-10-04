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

import { distinctUntilChanged, shareReplay, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, fromEvent, merge } from 'rxjs';
import { getDocumentVisibilityEvent$ } from 'cd-common/utils';
import { KEYS } from 'cd-utils/keycodes';

const KEYDOWN_EVENT = 'keydown';
const KEYUP_EVENT = 'keyup';

@Injectable({
  providedIn: 'root',
})
export class KeyboardService {
  public metaKeyDown$: Observable<boolean>;
  public altKeyDown$: Observable<boolean>;
  public spaceBarDown$: Observable<boolean>;
  public shiftKeyDown$: Observable<boolean>;

  constructor() {
    // Listens for CMD key (mac) down / up to select children
    const keydown$ = fromEvent<KeyboardEvent>(window, KEYDOWN_EVENT);
    const keyup$ = fromEvent<KeyboardEvent>(window, KEYUP_EVENT);
    const isVisible$ = getDocumentVisibilityEvent$();
    const keyPress$ = merge(keydown$, keyup$);

    this.altKeyDown$ = merge(
      keyPress$.pipe(map(({ type, key }) => type === KEYDOWN_EVENT && key === KEYS.Alt)),
      isVisible$
    ).pipe(distinctUntilChanged(), shareReplay({ bufferSize: 1, refCount: true }));

    this.metaKeyDown$ = keyPress$.pipe(
      map(({ type, key }) => type === KEYDOWN_EVENT && key === KEYS.Meta),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.shiftKeyDown$ = keyPress$.pipe(
      map(({ type, key }) => type === KEYDOWN_EVENT && key === KEYS.Shift),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.spaceBarDown$ = keyPress$.pipe(
      map(({ type, key }) => type === KEYDOWN_EVENT && key === KEYS.Space),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}
