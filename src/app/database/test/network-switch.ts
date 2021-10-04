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

export const NETWORK_ERROR_MESSAGE = 'net::ERR_INTERNET_DISCONNECTED';

const ORIGINAL_XHR_SEND = window.XMLHttpRequest.prototype.send;
const ORIGINAL_XHR_OPEN = window.XMLHttpRequest.prototype.open;
const ORIGINAL_FETCH = window.fetch;
const ORIGINAL_WS_SEND = window.WebSocket.prototype.send;

/**
 * Disables or enables network requests by stubbing the most common APIs,
 * `fetch`, `XMLHttpRequest`, and `WebSocket`, to throw a network error.
 * @experimental
 */
export class NetworkSwitch {
  disable() {
    const win = window as any;
    if (win.fetch === this.throwNetworkError) return;
    win.fetch = this.throwNetworkError;
    win.XMLHttpRequest.prototype.send = this.throwNetworkError;
    win.WebSocket.prototype.send = this.throwNetworkError;
  }

  enable() {
    const win = window as any;
    if (win.fetch === ORIGINAL_FETCH) return;
    win.fetch = ORIGINAL_FETCH;
    win.XMLHttpRequest.prototype.send = ORIGINAL_XHR_SEND;
    win.XMLHttpRequest.prototype.open = ORIGINAL_XHR_OPEN;
    win.WebSocket.prototype.send = ORIGINAL_WS_SEND;
  }

  private throwNetworkError() {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  /** Alternate method of disabling XHR. */
  replaceXhrOpen() {
    const win = window as any;
    const proto = win.win.XMLHttpRequest.prototype;
    proto.open = function (verb: string, _url: string, async: boolean, user: any, pass: any) {
      return ORIGINAL_XHR_OPEN.call(this, verb, 'fakehost', async, user, pass);
    };
  }
}
