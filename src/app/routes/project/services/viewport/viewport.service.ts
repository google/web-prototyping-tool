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

import { Injectable } from '@angular/core';
import { fromEvent, Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import * as cd from 'cd-interfaces';

export interface IWindowSize extends Pick<cd.IRect, 'width' | 'height'> {}

@Injectable({
  providedIn: 'root',
})
export class ViewportService {
  private _subscriptions = new Subscription();
  public windowSize$ = new BehaviorSubject<IWindowSize>({ width: 0, height: 0 });

  constructor() {
    const resizeEvent = fromEvent(window, 'resize', { passive: true });
    this._subscriptions.add(resizeEvent.pipe(debounceTime(500)).subscribe(this.updateViewport));
    this.updateViewport();
  }

  updateViewport = () => {
    const { innerWidth: width, innerHeight: height } = window;
    this.windowSize$.next({ width, height });
  };
}
