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

import { Injectable, NgZone } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { CdPostMessage } from './cd-messaging.action';

// TODO: pull correction origin's from environments object
const TARGET_ORIGIN = '*';

@Injectable({ providedIn: 'root' })
export class CdMessagingService {
  public messages$: Observable<CdPostMessage>;

  constructor(private _zone?: NgZone) {
    this.messages$ = fromEvent<MessageEvent>(window, 'message').pipe(
      filter((e) => e.data?.appMessage),
      map((e) => e.data)
    );
  }

  send = (win: Window, message: CdPostMessage): void => {
    win.postMessage(message, TARGET_ORIGIN);
  };

  postMessage(win: Window, message: CdPostMessage) {
    if (this._zone === undefined) return this.send(win, message);
    this._zone.runOutsideAngular(() => this.send(win, message));
  }

  postMessageToParent(message: CdPostMessage) {
    this.postMessage(window.parent, message);
  }

  postMessageToSandbox(iframe: HTMLIFrameElement, message: CdPostMessage) {
    const { contentWindow } = iframe;
    if (!contentWindow) return;
    this.postMessage(contentWindow, message);
  }
}
