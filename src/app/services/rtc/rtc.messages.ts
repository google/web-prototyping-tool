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

import { IChangeRequest, IUserCursor, IUserSelection } from 'cd-interfaces';

export interface IRtcMessageBase {
  name: string;
  sessionId: string;
}

export const RTC_CURSOR_POSITION_MESSAGE = 'rtc_cursor_pos';
export const RTC_HIDE_CURSOR_MESSAGE = 'rtc_hide_cursor';
export const RTC_SELECTION_MESSAGE = 'rtc_selection';
export const RTC_CHANGE_REQUEST_MESSAGE = 'rtc_change_request';

export class RtcMessageCursorPosition implements IRtcMessageBase {
  readonly name = RTC_CURSOR_POSITION_MESSAGE;
  constructor(public sessionId: string, public cursor: IUserCursor) {}
}

export class RtcMessageHideCursor implements IRtcMessageBase {
  readonly name = RTC_HIDE_CURSOR_MESSAGE;
  constructor(public sessionId: string) {}
}

export class RtcMessageSelection implements IRtcMessageBase {
  readonly name = RTC_SELECTION_MESSAGE;
  constructor(public sessionId: string, public selection: IUserSelection) {}
}

export class RtcMessageChangeRequest implements IRtcMessageBase {
  readonly name = RTC_CHANGE_REQUEST_MESSAGE;
  constructor(public sessionId: string, public changeRequest: IChangeRequest) {}
}

export type RtcMessage =
  | RtcMessageCursorPosition
  | RtcMessageHideCursor
  | RtcMessageSelection
  | RtcMessageChangeRequest;

// MESSAGE UTILS

export const stringifyRtcMessage = (message: RtcMessage): string => {
  const obj = Object.entries(message).reduce<any>((acc, curr) => {
    const [key, value] = curr;
    acc[key] = value;
    return acc;
  }, {});

  return JSON.stringify(obj);
};

export const parseRtcMessage = (messageStr: string): RtcMessage | undefined => {
  try {
    return JSON.parse(messageStr) as RtcMessage;
  } catch (e) {
    console.warn('Received malformed rtc message');
    return undefined;
  }
};
