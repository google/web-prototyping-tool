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

import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, fromEvent, Subscription, Subject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import {
  IPreviewMessage,
  PreviewMessageType,
  PreviewMessageCommand,
} from './external-preview-messaging.consts';

const TARGET_ORIGIN = '*';

@Injectable()
export class ExternalPreviewMessagingService implements OnDestroy {
  private _subscriptions = Subscription.EMPTY;
  private _messages$: Observable<IPreviewMessage>;
  public navigateHomeEvents$ = new Subject<void>();

  constructor(private _zone: NgZone) {
    // subscribe to post messages
    this._messages$ = fromEvent<MessageEvent>(window, 'message').pipe(
      filter(({ data }) => data && data.cdPreviewMessage),
      map(({ data }) => data)
    );

    this._subscriptions = this._messages$.subscribe(this.handlePostMessage);
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  handlePostMessage = (message: IPreviewMessage) => {
    const { type, command } = message;
    if (type === PreviewMessageType.Navigation && command === PreviewMessageCommand.Home) {
      this.navigateHomeEvents$.next();
    }
  };

  postMessageToParent(message: IPreviewMessage) {
    this._zone.runOutsideAngular(() => {
      window.parent.postMessage(message, TARGET_ORIGIN);
    });
  }

  sendBoardNavigationEvent(id: string) {
    this.postMessageToParent({
      type: PreviewMessageType.Navigation,
      cdPreviewMessage: true,
      params: { id },
    });
  }
}
